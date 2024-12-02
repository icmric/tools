async function useTool(req, context) {
    let urlRequestsBreakdown;
    let requestedToolQuery;
    let requestedTool;
    let bypassTransform = false;

    if (req.body.tool == null) {
        urlRequestsBreakdown = req.url.split(/\/|\?/);
        requestedTool = urlRequestsBreakdown[1];
        requestedToolQuery = removeUrlPrefix(req.query);
    } else {
        requestedTool = req.body.tool;
        requestedToolQuery = removeUrlPrefix(req.body.body);
    }

    if (req.body.bypassTransform == true) {
        bypassTransform = true;
    }

    const { services, getSchema } = context;
    const { ItemsService } = services;

    // change 'resources' to name of collection of tools
    const itemx = new ItemsService('resources', {
        schema: await getSchema(),
        accountability: req.accountability
    });

    let datax;
    try {
        datax = await itemx.readByQuery({ fields: ['*', 'retrieves.*'], filter: { 'title': { '_eq': requestedTool } } });
    } catch (e) { }

    if (datax == "") {
        return itemx.readByQuery({ fields: ['title'] });
    }

    let apiRequest = datax[0].retrieves;
    let tool = datax[0];

    context.data = {};
    context.data.reqAccountability = req.accountability;
    context.data.$request = requestedToolQuery;
    context.data.$tool = {};
    context.data.prevApiRsps = req.body.prevResponses ?? [];
    context.data.$tool.main = recursiveReplace(tool.main);

    // puts extraValues into context.data
    let extraValues = {};
    if (datax[0].extra_values != null) {
        for (let i = 0; i < datax[0].extra_values.length; i++) {
            let key = recursiveReplace(datax[0].extra_values[i].key);
            let value = recursiveReplace(datax[0].extra_values[i].value);
            extraValues[key] = value;
        }
    }
    context.data.extraValues = extraValues;

    apiRequest.request = recursiveReplace(apiRequest.request);

    // Makes API call and saves raw response
    context.data.apiResponse = await performApiCall(apiRequest);
    if (req.body.finalReq == false) {
        context.data.prevApiRsps.push(context.data.apiResponse);
        context.data.prevApiRsps = [];
    }

    let apiResponceObj;
    if (apiRequest.transform != null && bypassTransform == false) {
        // Uses passes transform object to gather all data to return
        apiResponceObj = await recursiveReplace(apiRequest.transform);
    } else {
        // If no transform object is provided, the raw api response is returned
        apiResponceObj = context.data.apiResponse;
    }

    return apiResponceObj;

    function removeUrlPrefix(obj) {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                let newKey = key.replace('$request.', '');
                let value = obj[key];

                if (typeof value === 'string') {
                    value = value.replace('$request.', '');
                } else if (typeof value === 'object' && value !== null) {
                    value = removeUrlPrefix(value);
                }

                if (newKey !== key) {
                    delete obj[key];
                }
                obj[newKey] = value;
            }
        }
        return obj;
    }

    /**
     * Resolves a value from a dot-notation path in the context object
     * @param {string} replacementVariablePath - Path to resolve (e.g. "user.name default")
     * @returns {*} Found value or default value if not found
     */
    function resolvePath(replacementVariablePath) {
        // Checks if the passed variable could be valid. If not, returns undefined
        if (!replacementVariablePath || typeof replacementVariablePath !== 'string') {
            return undefined;
        }

        let parts = replacementVariablePath.split(' ');
        // Variable pat (i.e. defaultValue.0.response)
        let path = "data." + parts[0];
        // Default value to return if path is not found
        let defaultValue;

        // If there is more than one thing in part, it contains a default value spread across every index after the first
        if (parts.length > 1) {
            // Sets the default value if one is provided
            parts.slice(1).join(' ');
        }  else {
            // Uses path as default value if none is provided
            defaultValue = path;        }

        try {
            // Splits the path into an array and reduces it to resolve the value
            const result = path.trim().split('.').reduce((prev, curr) => {
                // If prev does not exist, return undefined
                if (!prev) return undefined;
                // If prev is a string, return it as it is the final result and cannot be resolved further
                if (typeof prev === 'string') return prev;
                // If prev is not an object, return undefined
                if (typeof prev !== 'object') return undefined;
                // If prev is an array, return the element at the index of curr
                return prev[curr];
            }, context || {});

            return result !== undefined ? result : defaultValue;
        } catch (error) {
            // If an error occurs, return the default value
            return defaultValue;
        }
    }

    // Uses a regex to find all placeholders and run resolvePath() with them
    function replaceInValue(value) {
        let regex = /{(.*)}/g;
        return value.replace(regex, (match, p1) => {
            let returnValue = resolvePath(p1);
            let resolved;
            if (typeof returnValue === "string") {
                resolved = returnValue;
            } else {
                // if the result is not a string, turn it into a string
                resolved = JSON.stringify(returnValue);
            }
            return resolved !== undefined ? resolved : match;
        });
    }


    function recursiveReplace(rawObject) {
        if (typeof rawObject === 'string') {
            // End recursion, run replaceInValue() to find and replace placeholders
            let updatedValue = replaceInValue(rawObject);
            try {
                // attempts to convert to and return a JSON version of the updated value
                return JSON.parse(updatedValue);
            } catch (e) {
                // Will fail if the updated value is not JSON or Array, returns updatedValue as is
                return updatedValue;
            }
        } else if (Array.isArray(rawObject)) {
            // Recurses again if the value is an array for each item in the array
            return rawObject.map(item => recursiveReplace(item));
        } else if (rawObject !== null && typeof rawObject === 'object') {
            // Recurses again if the value is an object for each value in the object
            const result = {};
            for (const key in rawObject) {
                if (rawObject.hasOwnProperty(key)) {
                    result[key] = recursiveReplace(rawObject[key]);
                }
            }
            // result of the recursed object
            return result;
        }
        // Catch all
        return rawObject;
    }

    async function performApiCall(apiCallDetails) {
        // get the necessary details from apiCallDetails
        let { method, url, header } = apiCallDetails;
        let headers = {};

        url = replaceInValue(url);

        if (header != null) {
            // Build headers object from the header array
            header.forEach(h => {
                headers[h.key] = h.value;
            });
        }

        let apiResponse;
        let apiRequestInfo = {
            method: apiCallDetails.method,
            headers: headers != null ? headers : null,
            body: JSON.stringify(apiCallDetails.request) ?? null
        };


        //apiRequestInfo.body = JSON.stringify(apiCallDetails.request);


        // Execute the fetch request with the provided details and capture the response
        apiResponse = await fetch(url, apiRequestInfo).then(response => { return response.json() });
        return apiResponse;
    }
}

let reqExport;
let contextExport;

var index = (router, context) => {
	router.get('/*', async (req, res) => {
		// Will fail if the user does not have read acsess to both tools and parent collection
		try {
			reqExport = req;
			contextExport = context;
			let finalApiResponse = await useTool(reqExport, contextExport);
			res.send(finalApiResponse);
		} catch (e) {
			res.send('Request failed! ' + e);
		}
	});

	router.post('/*', async (req, res) => {
		// Will fail if the user does not have write acsess to both tools and parent collection
		try {
			reqExport = req;
			contextExport = context;
			let finalApiResponse = await useTool(reqExport, contextExport);
			res.send(finalApiResponse);
		} catch (e) {
			res.send('Request failed! ' + e);
		}
	});
};

export { contextExport, index as default, reqExport };
