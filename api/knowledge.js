import {blob} from './_blob-auth.js';
import {createKnowledgeHandler,createKnowledgeStore} from './_knowledge.js';

export default createKnowledgeHandler({store:createKnowledgeStore(blob)});
