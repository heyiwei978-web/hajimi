import {get as sdkGet,put as sdkPut} from '@vercel/blob';

// Every Blob call in api/ goes through this module. It pins authentication to the
// static read-write token so that the SDK never falls back to OIDC
// (VERCEL_OIDC_TOKEN / x-vercel-oidc-token + BLOB_STORE_ID), whatever variables a
// store connection adds to the environment. The token is read and checked on every
// call, before the SDK is invoked; a missing, blank or malformed token throws a
// BlobConfigError whose message never contains the token.

const TOKEN_FORMAT=/^vercel_blob_rw_[A-Za-z0-9]+_\S+$/;

export class BlobConfigError extends Error {
  constructor(message){super(message);this.name='BlobConfigError';this.code='no_credentials';}
}

export function blobAuth(env=process.env){
  const raw=env.BLOB_READ_WRITE_TOKEN;
  const token=typeof raw==='string'?raw.trim():'';
  if(!token)throw new BlobConfigError('BLOB_READ_WRITE_TOKEN is missing or empty');
  if(!TOKEN_FORMAT.test(token))throw new BlobConfigError('BLOB_READ_WRITE_TOKEN does not look like a Blob read-write token');
  return {token};
}

// Callers cannot select another credential: any token, oidcToken or storeId they pass
// is dropped and replaced by the validated static token.
function withToken(options){
  const {token:_token,oidcToken:_oidcToken,storeId:_storeId,...rest}=options||{};
  return {...rest,...blobAuth()};
}

export function createBlobClient(sdk={get:sdkGet,put:sdkPut}){
  return {
    async get(pathname,options){return sdk.get(pathname,withToken(options));},
    async put(pathname,body,options){return sdk.put(pathname,body,withToken(options));}
  };
}

export const blob=createBlobClient();
