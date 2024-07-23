import { useTool } from '../lib/functions.js';
export { req, context };

export default (router, context) => {
	router.get('/*', async (req, res) => {
		reqExport = req;
		contextExport = context;
		let finalApiResponse = await useTool(req, context);
		res.send(finalApiResponse);
	});
};