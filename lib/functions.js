export { useTool };

async function useTool(req, context) {

    let urlRequestsBreakdown;
    let requestedToolQuery;
    let requestedTool;
    if (req.body.tool == null) {
        urlRequestsBreakdown = req.url.split(/\/|\?/);
        requestedTool = urlRequestsBreakdown[1];
        requestedToolQuery = removeUrlPrefix(req.query);
    } else {
        requestedTool = req.body.tool;
        requestedToolQuery = removeUrlPrefix(req.body.body);
    }

    const { services, getSchema } = context;
    const { ItemsService } = services;

    // change 'api_parents' to name of collection of tools
    const itemx = new ItemsService('api_parents', {
        schema: await getSchema(),
        accountability: req.accountability
    });

    let datax;
    try {
        datax = await itemx.readByQuery({ fields: ['*', 'api.*'], filter: { 'title': { '_eq': requestedTool } } });
    } catch (e) { }

    if (datax == "") {
        return itemx.readByQuery({ fields: ['title'] });
    }

    let apiRequest = datax[0].api;
    let tool = datax[0];

    context.data = {};
    context.data.reqAccountability = req.accountability;
    context.data.$request = requestedToolQuery;
    context.data.$tool = {};
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

    let apiData = {
        "request": null,
    };

    if ((apiRequest.request == null || apiRequest.request == {}) == false) {
        apiData.request = recursiveReplace(apiRequest.request);
    }

    // Makes API call and saves raw response
    context.data.apiResponse = await performApiCall(apiRequest, apiData.request);

    let apiResponceObj;
    if (apiRequest.transform != null) {
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

    // Attempts to find a value at the given path. If no value is found, returns the path.
    function resolvePath(replacementVariablePath) {
        replacementVariablePath = "data." + replacementVariablePath;
        return replacementVariablePath.trim().split('.').reduce((prev, curr) => {
            if (prev && typeof prev === 'object') {
                return prev[curr];
            }
            return "Blank";
        }, context);
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

    async function performApiCall(apiCallDetails, apiCallBody) {
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
            headers: headers != null ? headers : null
        }

        if (apiCallBody != null) {
            apiRequestInfo.body = JSON.stringify(apiCallBody);
        }

        // Execute the fetch request with the provided details and capture the response
        apiResponse = await fetch(url, apiRequestInfo).then(response => { return response.json() })
        apiData.response = apiResponse;
        return apiResponse;
    }
}