import { HandshakeBody } from '@backend/models/HandshakeBody';
import { command } from 'avenger';
import { API } from '../providers/api.provider';

export const handshake = command((handshake: HandshakeBody) =>
  API.Public.Handshake({ Body: handshake })
);
