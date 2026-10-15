import {get as sdkGet,put as sdkPut} from '@vercel/blob';

// Every Blob call in api/ goes through this module. It pins authentication to the
// static read-write token so that the SDK never falls back to OIDC
// (VERCEL_OIDC_TOKEN / x-vercel-oidc-token + BLOB_STORE_ID), whatever variables a
// store connection adds to the environment. The token is read and checked on every
// call, before the SDK is invoked; a missing, blank or malformed token throws a
// BlobConfigError whose message never contains the token.
//
// Options are allow-listed per method. Anything else - credentials (token,
// oidcToken, storeId), custom headers (the SDK's get() lets options.headers override
// its own Authorization header) or any option the site does not use - is rejected
// before the SDK is called, so no caller can change how a request is authenticated.

const TOKEN_FORMAT=/^vercel_blob_rw_[A-Za-z0-9]+_\S+$/;
const ALLOWED_OPTIONS={
  get:new Set(['access','useCache']),
  put:new Set(['access','allowOverwrite','addRandomSuffix','contentType','ifMatch'])
};

export class BlobConfigError extends Error {
  constructor(message){super(message);this.name='BlobConfigError';this.code='no_credentials';}
}
export class BlobOptionError extends Error {
  constructor(message){super(message);this.name='BlobOptionError';this.code='unsupported_option';}
}

export function blobAuth(env=process.env){
  const raw=env.BLOB_READ_WRITE_TOKEN;
  const token=typeof raw==='string'?raw.trim():'';
  if(!token)throw new BlobConfigError('BLOB_READ_WRITE_TOKEN is missing or empty');
  if(!TOKEN_FORMAT.test(token))throw new BlobConfigError('BLOB_READ_WRITE_TOKEN does not look like a Blob read-write token');
  return {token};
}

function withToken(method,options){
  if(options===null||typeof options!=='object'||Array.isArray(options)||Object.getPrototypeOf(options)!==Object.prototype){
    throw new BlobOptionError(`Blob ${method} options must be a plain object`);
  }
  const allowed=ALLOWED_OPTIONS[method];
  // Reflect.ownKeys also sees symbol and non-enumerable keys.
  for(const key of Reflect.ownKeys(options)){
    if(typeof key!=='string'||!allowed.has(key))throw new BlobOptionError(`Blob ${method} option is not allowed: ${String(key)}`);
  }
  const copy={};
  for(const key of allowed)if(Object.hasOwn(options,key))copy[key]=options[key];
  return {...copy,...blobAuth()};
}

export function createBlobClient(sdk={get:sdkGet,put:sdkPut}){
  return {
    async get(pathname,options){return sdk.get(pathname,withToken('get',options));},
    async put(pathname,body,options){return sdk.put(pathname,body,withToken('put',options));}
  };
}

export const blob=createBlobClient();
