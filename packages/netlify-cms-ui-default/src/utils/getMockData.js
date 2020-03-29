import faker from 'faker';
import moment from 'moment';
import { randomRange, titleCase } from './helpers';
import mockImages from './mockImages';

const mockDataTypes = {
  post: () => ({
    id: faker.random.uuid(),
    featured: faker.random.boolean(),
    featuredImage: faker.random.arrayElement(mockImages),
    title: titleCase(faker.lorem.words(randomRange(4, 12))),
    description: faker.lorem.sentences(randomRange(1, 2)),
    category: faker.random.arrayElement([
      'News',
      'Sports',
      'Entertainment',
      'Life',
      'Money',
      'Tech',
      'Travel',
      'Opinion',
    ]),
    status: faker.random.arrayElement(['Published', 'Draft', 'In Review']),
    dateModified: moment(faker.date.recent()).format('MM/DD/YYYY @ HH:mm A'),
    dateCreated: moment(faker.date.recent()).format('MM/DD/YYYY @ HH:mm A'),
    author: `${faker.name.firstName()} ${faker.name.lastName()}`,
  }),
};

const getMockData = (type, len) => {
  const data = [];

  for (let i = 0; i < len; i++) {
    const item = mockDataTypes[type]();

    data.push(item);
  }

  return data;
};

export default getMockData;
