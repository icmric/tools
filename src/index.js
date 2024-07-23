import { useTool } from '../lib/functions.js';
export { reqExport, contextExport };

let reqExport;
let contextExport;
export default (router, context) => {
	router.get('/*', async (req, res) => {
		reqExport = req;
		contextExport = context;
		let finalApiResponse = await useTool(reqExport, contextExport);
		res.send(finalApiResponse);
	});
};