import { Config } from '../types/redux';

export const selectLocale = (state: Config) => state.get('locale', 'en') as string;
