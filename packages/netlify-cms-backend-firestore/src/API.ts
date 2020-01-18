import { trim } from 'lodash';
import {
  APIError,
  localForage,
  AssetProxy,
  Entry,
  PersistOptions,
  ImplementationEntry,
  EditorialWorkflowError,
} from 'netlify-cms-lib-util';
import { User } from '@firebase/auth-types';
import {
  FirebaseFirestore,
  Query,
} from '@firebase/firestore-types';
import {
  FirebaseStorage,
  Reference,
} from '@firebase/storage-types';
import uuid from 'uuid/v4';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const firebase: any;

const db: FirebaseFirestore = firebase.firestore();
const getCurrentUser: () => User | null = () => firebase.auth().currentUser; 

export const API_NAME = 'Firestore';

export interface Config {
  dbCollection?: string;
  bucket?: string;
  mediaFolder: string;
}

export interface Draft {
  id: string;
  title: string | null;
  slug: string;
  collection: string;
  published: boolean;
  status: 'draft' | 'pending_review' | 'pending_publish' | '';
  content: string;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
  updatedBy: string;
  deleted: boolean;
  deletedAt?: number;
  deletedBy?: string;
}

export interface PR {
  number: number;
  head: string | { sha: string };
}

export interface Branch {
  ref: string;
}

export interface BlobArgs {
  sha: string;
  repoURL: string;
  parseText: boolean;
}

const fetchDB = async <T>(dbPath: string): Promise<T> => {
  const doc = await db.doc(dbPath).get();

  if (!doc.exists) {
    throw new APIError('Could not find data', 404, API_NAME);
  }

  return doc.data() as T;
};

const queryDB = async <T>(q: Query): Promise<T[]>  => {
  const ret = await q.get();
  return ret.docs.map((doc) => doc.data() as T);
};

const splitPath = (path: string): [string, string] => {
  const res = path.split('/');
  // 'foo/bar-baz.md' => ['foo', 'bar-baz']
  return [res[0], res[1].split('.')[0]];
}

export default class API {
  dbCollection: string;
  mediaFolder: string;
  storageRef: Reference;

  _userPromise?: Promise<User>;
  _userInitialized?: boolean;

  constructor(config: Config) {
    this.dbCollection = config.dbCollection || 'cmsContent';
    this.mediaFolder = config.mediaFolder;


    const storage: FirebaseStorage = config.bucket ? firebase.app().storage(config.bucket) : firebase.storage();
    this.storageRef = storage.ref();
  }

  async user() {
    if (this._userInitialized) {
      const u = getCurrentUser();
      if (u) {
        return u;
      }
      
      throw new APIError('You are not signed in', 401, API_NAME);
    }

    if (!this._userPromise) {
      this._userPromise = new Promise((resolve, reject) => {
        firebase.auth().onIdTokenChanged((user: User | null) => {
          this._userInitialized = true;
          if (user) {
            resolve(user);
          } else {
            reject(new APIError('You are not signed in', 401, API_NAME));
          }
        });
      });
    }

    return this._userPromise;
  }

  async hasWriteAccess() {
    const u = await this.user();
    try {
      const doc = await fetchDB<{ canEditPosts?: boolean }>(`admins/${u.uid}`);

      return !!doc!.canEditPosts;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async listAllMedia() {
    const allMedia = await this.storageRef.child(this.mediaFolder).listAll();

    return Promise.all(allMedia.items.map(async (item) => {
      const metaData = await item.getMetadata();
      const url = await item.getDownloadURL();
      return {
        id: item.fullPath,
        name: item.name,
        size: metaData.size,
        displayURL: url,
        path: url,
        url,
      };
    }));
  }

  async getMediaFile(path: string) {
    const item = this.storageRef.child(path);
    const metaData = await item.getMetadata();
    const url = await item.getDownloadURL();
    return {
      id: item.fullPath,
      name: item.name,
      size: metaData.size,
      displayURL: url,
      path: url,
      url,
    };
  }

  async readDraft(path: string): Promise<ImplementationEntry> {
    const [collection, slug] = splitPath(path);
    const draft = await this.retrieveDraft(collection, slug);
    return this.draftToEntry(draft);
  }

  async draftsByFolder(path: string): Promise<ImplementationEntry[]> {
    console.warn('called draftsByFolder', path);
    const folder = trim(path, '/');
    const drafts = await queryDB<Draft>(
      db.collection(this.dbCollection)
        .where('published', '==', true)
        .where('collection', '==', folder)
        .where('deleted', '==', false)
    );

    // cache all data
    for (const draft of drafts) {
      this.cacheDraft(draft);
    }

    return drafts.map(this.draftToEntry, this);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async persistFiles(entry: Entry | null, mediaFiles: AssetProxy[], options: PersistOptions) {
    console.log('persistFiles', entry, mediaFiles, options);
    if (mediaFiles && (mediaFiles.length > 0)) {
      await Promise.all(mediaFiles.map(async (f) => {
        if (!f.fileObj) {
          throw new Error('No file object for upload');
        }
        const ref = this.storageRef.child(f.path);
        await ref.put(f.fileObj);
      }));
    }

    if (!entry) {
      return;
    }

    if (options.newEntry) {
      await this.createDraft({
        content: entry.raw,
        collection: options.collectionName || 'default',
        published: false,
        slug: entry.slug,
        status: options.status as Draft["status"] || 'draft',
        title: options.parsedData?.title || null,
      });
    } else {
      const updates: Partial<Draft> = {
        content: entry.raw,
        slug: entry.slug,
      };

      if (options.parsedData?.title) {
        updates.title = options.parsedData?.title;
      }

      const draft = await this.retrieveDraft(...splitPath(entry.path));
      await this.updateDraft(draft, updates);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async  unpublishDraft(path: string, _message: string) {
    const draft = await this.retrieveDraft(...splitPath(path));
    this.updateDraft(draft, {
      published: false,
      status: 'pending_publish',
    });
  }

  async unpublishedDrafts() {
    const drafts = await queryDB<Draft>(
      db.collection(this.dbCollection)
        .where('published', '==', false)
        .where('deleted', '==', false)
    );

    // cache all data (use collection and slug as key)
    for (const draft of drafts) {
      this.cacheDraft(draft);
    }

    return drafts.map(this.draftToEntry, this);
  }

  async readUnpublishedDraft(collection: string, slug: string) {
    const draft = await this.retrieveUnpublishedDraft(collection, slug);
    return this.draftToEntry(draft);
  }

  async updateUnpublishedDraftStatus(collection: string, slug: string, newStatus: string) {
    const draft = await this.retrieveUnpublishedDraft(collection, slug);
    this.updateDraft(draft, {
      status: newStatus as Draft["status"],
    });
  }

  async deleteUnpublishedDraft(collection: string, slug: string) {
    const draft = await this.retrieveUnpublishedDraft(collection, slug);
    this.deleteDraft(draft);
  }

  async publishUnpublishedDraft(collection: string, slug: string) {
    const draft = await this.retrieveUnpublishedDraft(collection, slug);
    this.updateDraft(draft, {
      published: true,
      status: '',
    });
  }


  private createDraft(
    data: Omit<Draft, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'deleted'>,
  ) {
    const id = uuid();
    const newDraft: Draft = {
      ...data,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: getCurrentUser()?.email || getCurrentUser()?.uid || 'unknown',
      updatedBy: getCurrentUser()?.email || getCurrentUser()?.uid || 'unknown',
      deleted: false,
    };

    this.cacheDraft(newDraft);

    return db.doc(`${this.dbCollection}/${id}`)
      .set(newDraft);
  }

  private async updateDraft(
    draft: Draft,
    data: Partial<Pick<Draft, 'content' | 'status' | 'published' | 'slug' | 'title'>>
  ) {
    const update = {
      ...data,
      updatedAt: Date.now(),
      updatedBy: getCurrentUser()?.email || getCurrentUser()?.uid || 'unknown',
    };

    this.cacheDraft({
      ...draft,
      ...update,
    });

    // store versions
    if (data.content || data.title) {
      await db.doc(`${this.dbCollection}/${draft.id}/drafts/${(new Date(draft.updatedAt)).toISOString()}`)
        .set(draft);
    }

    return db.doc(`${this.dbCollection}/${draft.id}`)
      .update(update);
  }

  private cacheKey(draft: Draft) {
    return `draft.${draft.collection}::${draft.slug}`;
  }

  private deleteDraft(draft: Draft) {
    localForage.removeItem(this.cacheKey(draft));
    return db.doc(`${this.dbCollection}/${draft.id}`)
      .update({
        deleted: true,
        deletedAt: Date.now(),
        deletedBy: getCurrentUser()?.email || getCurrentUser()?.uid || 'unknown',
      });
  }

  private async cacheDraft(draft: Draft) {
    localForage.setItem(this.cacheKey(draft), JSON.stringify(draft));
  }

  private async retrieveDraft(collection: string, slug: string) {
    const key = `draft.${collection}::${slug}`;
    try {
      const cached = await localForage.getItem<string>(key);
      if (cached) {
        return JSON.parse(cached) as Draft;
      }
    // eslint-disable-next-line no-empty
    } catch {}

    const drafts = await queryDB<Draft>(
      db.collection(this.dbCollection)
        .where('collection', '==', collection)
        .where('slug', '==', slug)
        .where('deleted', '==', false)
        .limit(1)
    );

    const d = drafts[0];

    if (!d) {
      throw new APIError('Draft not found', 404, API_NAME);
    }

    localForage.setItem(key, JSON.stringify(d));
    return d;
  }

  private async retrieveUnpublishedDraft(collection: string, slug: string) {
    try {
      return await this.retrieveDraft(collection, slug);
    } catch {
      throw new EditorialWorkflowError('content is not under editorial workflow', true);
    }
  }

  private draftToEntry(draft: Draft): ImplementationEntry {
    return {
      data: draft.content,
      file: {
        id: draft.id,
        label: draft.title || undefined,
        path: `${draft.collection}/${draft.slug}.md`,
      },
      isModification: false,
      // mediaFiles: [],
      metaData: {
        collection: draft.collection,
        status: draft.status,
      },
      slug: draft.slug,
    };
  }
}
