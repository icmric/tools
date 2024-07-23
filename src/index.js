import { useTool } from '../lib/functions.js';

let reqExport;
let contextExport;
export default (router, context) => {
	router.get('/*', async (req, res) => {
		reqExport = req;
		contextExport = context;
		//let test = new useTool;
		let finalApiResponse = await useTool(reqExport, contextExport);
		res.send(finalApiResponse);
	});
};

export { reqExport, contextExport };