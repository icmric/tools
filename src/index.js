import { useTool } from '../lib/functions.js';
export { reqExport, contextExport };

let reqExport;
let contextExport;

export default (router, context) => {
	router.get('/*', async (req, res) => {
		// dodgy way of checking auth, should compare against list of users
		// to use perm level rather than user, use .admin instead of .user 
		if (req.accountability.user != null) {
			reqExport = req;
			contextExport = context;
			let finalApiResponse = await useTool(reqExport, contextExport);
			res.send(finalApiResponse);
		} else {
			// Can also be sent as plain string
			res.send({'Request failed': 'Unauthorized, Please log in!'});
		}
	});
};