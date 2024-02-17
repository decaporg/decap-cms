import { faker } from '@faker-js/faker';
import dayjs from 'dayjs';

import { randomRange, titleCase } from './helpers';
import mockImages from './mockImages';

const mockDataTypes = {
  post: () => ({
    id: faker.string.uuid(),
    featured: faker.datatype.boolean(),
    featuredImage: faker.helpers.arrayElement(mockImages),
    title: titleCase(faker.lorem.words(randomRange(4, 12))),
    description: faker.lorem.sentences(randomRange(1, 2)),
    category: faker.helpers.arrayElement([
      'News',
      'Sports',
      'Entertainment',
      'Life',
      'Money',
      'Tech',
      'Travel',
      'Opinion',
    ]),
    status: faker.helpers.arrayElement(['Published', 'Draft', 'In Review']),
    dateModified: dayjs(faker.date.recent()).format('MM/DD/YYYY @ HH:mm A'),
    dateCreated: dayjs(faker.date.recent()).format('MM/DD/YYYY @ HH:mm A'),
    author: `${faker.person.fullName()}`,
  }),
};

function getMockData(type, len) {
  const data = [];

  for (let i = 0; i < len; i++) {
    const item = mockDataTypes[type]();

    data.push(item);
  }

  return data;
}

export default getMockData;
