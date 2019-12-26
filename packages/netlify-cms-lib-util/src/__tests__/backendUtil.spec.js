import { parseLinkHeader, getAllResponses, getPathDepth } from '../backendUtil';
import { oneLine } from 'common-tags';
import nock from 'nock';

describe('parseLinkHeader', () => {
  it('should return the right rel urls', () => {
    const url = 'https://api.github.com/resource';
    const link = oneLine`
      <${url}?page=1>; rel="first",
      <${url}?page=2>; rel="prev",
      <${url}?page=4>; rel="next",
      <${url}?page=5>; rel="last"
    `;
    const linkHeader = parseLinkHeader(link);

    expect(linkHeader.next).toBe(`${url}?page=4`);
    expect(linkHeader.last).toBe(`${url}?page=5`);
    expect(linkHeader.first).toBe(`${url}?page=1`);
    expect(linkHeader.prev).toBe(`${url}?page=2`);
  });
});

describe('getAllResponses', () => {
  const generatePulls = length => {
    return Array.from({ length }, (_, id) => {
      return { id: id + 1, number: `134${id}`, state: 'open' };
    });
  };

  function createLinkHeaders({ page, pageCount }) {
    const pageNum = parseInt(page, 10);
    const pageCountNum = parseInt(pageCount, 10);
    const url = 'https://api.github.com/pulls';
    const link = linkPage => `<${url}?page=${linkPage}>`;

    const linkHeader = oneLine`
      ${pageNum === 1 ? '' : `${link(1)}; rel="first",`}
      ${pageNum === pageCountNum ? '' : `${link(pageCount)}; rel="last",`}
      ${pageNum === 1 ? '' : `${link(pageNum - 1)}; rel="prev",`}
      ${pageNum === pageCountNum ? '' : `${link(pageNum + 1)}; rel="next",`}
    `.slice(0, -1);

    return { Link: linkHeader };
  }

  function interceptCall({ perPage = 30, repeat = 1, data = [] } = {}) {
    nock('https://api.github.com')
      .get('/pulls')
      .query(true)
      .times(repeat)
      .reply(uri => {
        const searchParams = new URLSearchParams(uri.split('?')[1]);
        const page = searchParams.get('page') || 1;
        const pageCount = data.length <= perPage ? 1 : Math.ceil(data.length / perPage);
        const pageLastIndex = page * perPage;
        const pageFirstIndex = pageLastIndex - perPage;
        const resp = data.slice(pageFirstIndex, pageLastIndex);
        return [200, resp, createLinkHeaders({ page, pageCount })];
      });
  }

  it('should return all paged response', async () => {
    interceptCall({ repeat: 3, data: generatePulls(70) });
    const res = await getAllResponses('https://api.github.com/pulls');
    const pages = await Promise.all(res.map(res => res.json()));

    expect(pages[0]).toHaveLength(30);
    expect(pages[1]).toHaveLength(30);
    expect(pages[2]).toHaveLength(10);
  });
});

describe('getPathDepth', () => {
  it('should return 1 for empty string', () => {
    expect(getPathDepth('')).toBe(1);
  });

  it('should return 2 for path of one nested folder', () => {
    expect(getPathDepth('{{year}}/{{slug}}')).toBe(2);
  });
});
