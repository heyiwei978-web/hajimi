import {readSession,securityChecks} from './_auth.js';
import {guardRequest} from './_security.js';

export default async function handler(req,res){
  if(!guardRequest(req,res,{methods:['GET']}))return;
  const session=readSession(req);
  // The configuration self-check is for the signed-in administrator only; anonymous
  // visitors learn nothing about how the login is set up.
  return res.status(200).json({authenticated:!!session,user:session?.u||null,...(session?{security:securityChecks()}:{})});
}
