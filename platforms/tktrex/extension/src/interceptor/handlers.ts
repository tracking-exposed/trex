export interface APIHandler {
  urls: string[];
  method: 'GET' | 'POST';
  transform: (data: any) => void;
}

export const listHandler: APIHandler = {
  urls: ['/v1/list'],
  method: 'POST',
  transform: (data) => {
    console.log('data from list', data);
  },
};

export const recommendedListHandler: APIHandler = {
  urls: ['/api/post/item_list/', '/api/recommend/item_list/'],
  method: 'GET',
  transform: (data: any) => {
    console.log('data from recommended item', data);
  },
};
