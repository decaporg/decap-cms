import repeatable from './WidgetHOCs/repeatable';

export const HOCs = [repeatable];

export const applyHOCs = component => repeatable(component);
