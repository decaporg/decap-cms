
import Polyglot from 'node-polyglot';
import english from './en.json';

const instance = new Polyglot({phrases: english});

export default instance;
