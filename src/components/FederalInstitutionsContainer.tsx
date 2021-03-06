import * as React from 'react';
import { Component } from 'react';
import AppBar from 'material-ui/AppBar';
import { ApplicationState } from '../store';
import { connect } from 'react-redux';
import { FederalInstitutionView } from './FederalInstitutionView';
import * as DepartmentDBStore from '../store/DepartmentDBReducer';
import MenuItem from 'material-ui/MenuItem';
import Paper from 'material-ui/Paper';
import SelectField from 'material-ui/SelectField';
import TextField from 'material-ui/TextField';
import Toggle from 'material-ui/Toggle';
import {
    Toolbar,
    ToolbarGroup,
    ToolbarSeparator,
    ToolbarTitle
} from 'material-ui/Toolbar';

import {
    DepartmentDBState,
} from './../services/data-types';

type FedInstitutionsProps = DepartmentDBState &
    typeof DepartmentDBStore.actionCreators;

const styles = {
    mainContainer: {
        margin: 5,
        height: '100%',
    } as React.CSSProperties,
    fedContainer: {
        width: '100%',
        overflow: 'auto',
        display: 'flex',
    } as React.CSSProperties,
};

export class FederalInstitutionsContainer extends Component<FedInstitutionsProps, void> {
    handleSearchTxtChanged(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.keyCode === 13) {
            this.props.setFedInstitutionFilter({
                ...this.props.fedInstitutionFilter,
                searchTxt: e.currentTarget.value
            });
        }
    }

    handleRSSDIDChanged = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.keyCode === 13) {
            let newVal = e.currentTarget.value;

            this.props.setFedInstitutionFilter({
                ...this.props.fedInstitutionFilter,
                RSSDID: newVal.trim() === '' ? undefined : parseInt(newVal, 10)
            });
        }
    }

    handleSelectedTypeChanged = (evt: React.FormEvent<{}>,
        index: number,
        newVal: string[]) => {
        this.props.setFedInstitutionFilter({
            ...this.props.fedInstitutionFilter,
            selectedTypes: newVal.length === 0 ? [''] : newVal.filter(x => x !== ''),
        });
    }

    handleSelectedStateChanged = (evt: React.FormEvent<{}>,
        index: number,
        newVal: string[]) => {
        this.props.setFedInstitutionFilter({
            ...this.props.fedInstitutionFilter,
            selectedStates: Array.isArray(newVal) && newVal.length === 0 ? [''] : newVal,
        });
    }

    render() {
        let {
            fedInstitutions,
            fedInstitutionTypes,
            fedInstitutionFilter,
            states,
        } = this.props;

        return (
            <Paper style={styles.mainContainer} zDepth={2}>
                <AppBar
                    titleStyle={{ fontSize: 20 }}
                    showMenuIconButton={false}
                    title={(
                        <span>Federal Institutions <small> | Count: {fedInstitutions.length}</small></span>
                    )} />
                <Toolbar style={{ height: 35, fontSize: 20 }}>
                    <ToolbarGroup firstChild={true}>
                         <ToolbarTitle text="Search" />
                        <TextField
                            onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => this.handleSearchTxtChanged(e)}
                            hintText="search by name..." />
                        <Toggle
                            style={{ width: 70 }}
                            defaultToggled={true}
                            label={fedInstitutionFilter.isStartsWith ? 'starts' : 'contains'} />
                    </ToolbarGroup>
                    <ToolbarGroup>
                        <TextField
                            onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => this.handleRSSDIDChanged(e)}
                            hintText="enter RSSDID..." />
                        <SelectField
                            style={{ fontSize: 15 }}
                            multiple={true}
                            value={fedInstitutionFilter.selectedTypes}
                            onChange={this.handleSelectedTypeChanged}>
                            <MenuItem
                                value={''}
                                primaryText="Select Type" />
                            {
                                fedInstitutionTypes.map(fedType =>
                                    (
                                        <MenuItem key={fedType.FederalEntityTypeCode}
                                            value={fedType.FederalEntityTypeCode}
                                            primaryText={fedType.Name} />)
                                )}
                        </SelectField>
                        <SelectField
                            style={{ fontSize: 15 }}
                            multiple={true}
                            value={fedInstitutionFilter.selectedStates}
                            onChange={this.handleSelectedStateChanged}>
                            <MenuItem
                                value={''}
                                primaryText="Select State" />
                            {
                                states.map(fedState =>
                                    (
                                        <MenuItem key={fedState.StateCode}
                                            value={fedState.StateCode}
                                            primaryText={fedState.Name} />)
                                )}
                        </SelectField>
                    </ToolbarGroup>
                    <ToolbarSeparator />
                </Toolbar>
                <div style={styles.fedContainer}>
                    {fedInstitutions.map(f => (
                        <FederalInstitutionView {...this.props} key={f.RSSDID}
                            fedInst={f}
                        />
                    ))}
                </div>
            </Paper>
        );
    }
}

export default connect(
    (state: ApplicationState) => state.departmentDBs,
    DepartmentDBStore.actionCreators
)(FederalInstitutionsContainer);