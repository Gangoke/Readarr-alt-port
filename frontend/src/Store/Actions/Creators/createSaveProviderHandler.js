import $ from 'jquery';
import _ from 'lodash';
import { batchActions } from 'redux-batched-actions';
import createAjaxRequest from 'Utilities/createAjaxRequest';
import getProviderState from 'Utilities/State/getProviderState';
import { removeItem, set, updateItem } from '../baseActions';

const abortCurrentRequests = {};
let lastSaveData = null;

export function createCancelSaveProviderHandler(section) {
  return function(getState, payload, dispatch) {
    if (abortCurrentRequests[section]) {
      abortCurrentRequests[section]();
      abortCurrentRequests[section] = null;
    }
  };
}

function createSaveProviderHandler(section, url, options = {}, removeStale = false) {
  return function(getState, payload, dispatch) {
    dispatch(set({ section, isSaving: true }));

    const {
      id,
      queryParams = {},
      ...otherPayload
    } = payload;

    const saveData = Array.isArray(id) ? id.map((x) => getProviderState({ id: x, ...otherPayload }, getState, section)) : getProviderState({ id, ...otherPayload }, getState, section);
    const requestUrl = id ? `${url}/${id}` : url;
    const params = { ...queryParams };

    // If the user is re-saving the same provider without changes
    // force it to be saved. Only applies to editing existing providers.

    if (id && _.isEqual(saveData, lastSaveData)) {
      params.forceSave = true;
    }

    lastSaveData = saveData;

    const ajaxOptions = {
      url: `${requestUrl}?${$.param(params, true)}`,
      method: id ? 'PUT' : 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify(saveData)
    };

    const { request, abortRequest } = createAjaxRequest(ajaxOptions);

    abortCurrentRequests[section] = abortRequest;

    request.done((data) => {
      lastSaveData = null;

      if (!Array.isArray(data)) {
        data = [data];
      }

      const toRemove = removeStale && Array.isArray(id) ? _.difference(id, _.map(data, 'id')) : [];

      dispatch(batchActions(
        data.map((item) => updateItem({ section, ...item })).concat(
          toRemove.map((item) => removeItem({ section, id: item }))
        ).concat(
          set({
            section,
            isSaving: false,
            saveError: null,
            pendingChanges: {}
          })
        )));
    });

    request.fail((xhr) => {
      dispatch(set({
        section,
        isSaving: false,
        saveError: xhr.aborted ? null : xhr
      }));
    });
  };
}

export default createSaveProviderHandler;
