import { endpoints as Creator } from "./creator.endpoints";
import { endpoints as Public } from "./public.endpoints";

export const Endpoints = {
  Public,
  Creator,
};

export type Endpoints = typeof Endpoints;
