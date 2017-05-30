import { AppThunkAction, ApplicationState } from './index';
import { DepartmentDB, Institution, InstitutionFilter, State } from './../services/data-types';
import { Reducer } from 'redux';

const baseUrl = `http://dev.informars.com/webservices/FedSvc/odata/`;

export interface DepartmentDBState {
    activeDeptDB?: DepartmentDB;
    activeInstitutions: Array<Institution>;
    departmentDBs: Array<DepartmentDB>;
    deptDBsLoading: boolean;
    searchTxt: string;
    institutionsLoading: boolean;
    institutionFilter: InstitutionFilter;
    institutionTotalCnt: number;
    states: Array<State>;
}

interface RequestDepartmentDBsAction {
    type: 'REQUEST_DEPARTMENTDBS';
    searchTxt: string;
    institutionFilter: InstitutionFilter;
};

interface ReceiveDepartmentDBsAction {
    type: 'RECEIVE_DEPARTMENTDBS';
    searchTxt: string;
    departmentDBs: Array<DepartmentDB>;
};

interface SetInstitutionFilter {
    type: 'SET_INSTITUTION_FILTER';
    institutionFilter: InstitutionFilter;
}

interface LoadStatesAction {
    type: 'LOAD_STATES';
    states: Array<State>;
}

interface RequestInstitutionsAction {
    type: 'REQUEST_INSTITUTIONS';
};

interface ReceiveInstitutionsAction {
    type: 'RECEIVE_INSTITUTIONS';
    activeInstitutions: Array<Institution>;
    cnt: number;
};

interface SelectDeptDBAction {
    type: 'SELECT_DEPTDB';
    deptDBID: number;
    institutionFilter: InstitutionFilter;
};

interface ToggleSelectionAction {
    type: 'TOGGLE_SELECTION';
    id: string;
}

type KnownAction = RequestDepartmentDBsAction | ReceiveDepartmentDBsAction | SetInstitutionFilter
    | ReceiveInstitutionsAction | RequestInstitutionsAction | ToggleSelectionAction
    | SelectDeptDBAction | LoadStatesAction;

const fetchInstitutions =
    (dispatch: (action: KnownAction) => void, instFilter: InstitutionFilter) => {

        dispatch({ type: 'REQUEST_INSTITUTIONS' });

        let reqTxt = `${baseUrl}Institutions?$filter=DeptDBID eq ${instFilter.deptDBID}`;

        if (instFilter.searchTxt) {
            let encodedTxt = encodeURIComponent(instFilter.searchTxt);

            reqTxt += ` and ${instFilter.isStartsWith ? 'startswith' : 'contains'}(Name, '${encodedTxt}')`;
        }

        if (instFilter.selectedStates !== null && instFilter.selectedStates.length) {
            let statesTxt = instFilter.selectedStates.map(x => `StateCode eq '${x}'`).join(' or ');
            reqTxt += `and (${statesTxt})`;
        }

        reqTxt += `&$top=60&$expand=FederalInstitution&$orderby=Name,StateCode&$count=true`;
        // console.dir(reqTxt);
        fetch(reqTxt)
            .then(response => response.json())
            .then(insts => {
                let institutions: Array<Institution> = insts.value;

                institutions.forEach((i: Institution) => {
                    i.IsSelected = false;
                });

                dispatch({
                    type: 'RECEIVE_INSTITUTIONS',
                    activeInstitutions: institutions,
                    cnt: insts['@odata.count'],
                });
            }
            );

    };

export const actionCreators = {
    loadStates: ():
        AppThunkAction<KnownAction> => (dispatch: (action: KnownAction) => void, getState: () => ApplicationState) => {
            fetch(`${baseUrl}States`)
                .then(response => response.json())
                .then(states => dispatch({ type: 'LOAD_STATES', states: states.value }));
        }
    ,
    requestDepartmentDBs: (searchTxt: string, instFilter: InstitutionFilter):
        AppThunkAction<KnownAction> => (dispatch: (action: KnownAction) => void, getState: () => ApplicationState) => {

            let nameFilter = `$filter=startswith(Name, '${searchTxt}')&`;
            let reqTxt = `${baseUrl}DepartmentDBs?${searchTxt && nameFilter}$expand=Department`;

            fetch(reqTxt)
                .then(response => response.json())
                .then(depts => {
                    let deptDBID: number = depts.value[0].DeptDBID;
                    instFilter.deptDBID = deptDBID;

                    fetchInstitutions(dispatch, instFilter);

                    dispatch({ type: 'RECEIVE_DEPARTMENTDBS', searchTxt: searchTxt, departmentDBs: depts.value });
                });

            dispatch({ type: 'REQUEST_DEPARTMENTDBS', searchTxt: searchTxt, institutionFilter: instFilter });
        },

    setInstitutionFilter: (instFilter: InstitutionFilter):
        AppThunkAction<KnownAction> => (dispatch: (action: KnownAction) => void, getState: () => ApplicationState) => {
            fetchInstitutions(dispatch, instFilter);

            dispatch({ type: 'SET_INSTITUTION_FILTER', institutionFilter: instFilter });
        },

    selectDeptDB: (deptDBID: number, instFilter: InstitutionFilter):
        AppThunkAction<KnownAction> => (dispatch, getState) => {
            fetchInstitutions(dispatch, instFilter);

            dispatch({ type: 'SELECT_DEPTDB', deptDBID: deptDBID, institutionFilter: instFilter });
        },

    toggleSelection: (id: string) => (dispatch: (action: KnownAction) => void, getState: () => ApplicationState) => {
        dispatch({ type: 'TOGGLE_SELECTION', id: id });
    }
};

const unloadedState: DepartmentDBState = {
    activeDeptDB: undefined,
    activeInstitutions: [],
    departmentDBs: [],
    deptDBsLoading: false,
    institutionsLoading: false,
    institutionFilter: {
        deptDBID: 0,
        searchTxt: '',
        isStartsWith: true,
        selectedStates: [],
    },
    institutionTotalCnt: 0,
    searchTxt: '',
    states: [],
};

export const reducer: Reducer<DepartmentDBState> = (state: DepartmentDBState, action: KnownAction) => {
    switch (action.type) {
        case 'REQUEST_DEPARTMENTDBS':

            return {
                ...state,
                departmentDBs: [],
                deptDBsLoading: true,
            };

        case 'RECEIVE_DEPARTMENTDBS':

            return {
                ...state,
                activeDeptDB: action.departmentDBs ? action.departmentDBs[0] : undefined,
                departmentDBs: action.departmentDBs,
                deptDBsLoading: false,
            };

        case 'SET_INSTITUTION_FILTER':

            return {
                ...state,
                institutionFilter: action.institutionFilter,
            };

        case 'LOAD_STATES':

            return {
                ...state,
                states: action.states,
            };

        case 'REQUEST_INSTITUTIONS':

            return {
                ...state,
                activeInstitutions: [],
                institutionsLoading: true,
            };

        case 'RECEIVE_INSTITUTIONS':

            return {
                ...state,
                activeInstitutions: action.activeInstitutions,
                institutionTotalCnt: action.cnt,
                institutionsLoading: false,
            };

        case 'SELECT_DEPTDB':
            let activeDB = state.departmentDBs.filter(d => d.DeptDBID === action.deptDBID)[0];
            action.institutionFilter.deptDBID = action.deptDBID;

            actionCreators.setInstitutionFilter(action.institutionFilter);
            return {
                ...state,
                activeDeptDB: activeDB,
            };

        case 'TOGGLE_SELECTION':
            let targetInst = state.activeInstitutions.filter(i => i.CustomID === action.id)[0];
            targetInst.IsSelected = !targetInst.IsSelected;

            return {
                ...state,
            };

        default:
            return state || unloadedState;
    }
};