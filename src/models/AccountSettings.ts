
interface AccountKeys {
  publicKey?: string;
  secretKey?: string;
}

export interface AccountSettings extends AccountKeys {
  active: boolean;
  svg: boolean;
  videorep: boolean;
  playhide: boolean;
  community: boolean;
  alphabeth: boolean;
  ux: boolean;
}
