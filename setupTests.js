import 'raf/polyfill';
import enzyme from 'enzyme';
import enzymeAdapter from 'enzyme-adapter-react-16';

enzyme.configure({ adapter: new enzymeAdapter() });