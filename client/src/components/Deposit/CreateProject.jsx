import React from 'react';

import { withStyles } from '@material-ui/core/styles';

import FilesInputs from './FormComponents/FilesInputs';
import KeyWords from './FormComponents/KeyWords';

import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Switch from '@material-ui/core/Switch';

import { TextValidator, ValidatorForm } from 'react-material-ui-form-validator';
import AuthService from '../AuthService';
import { withSnackbar } from "../../providers/SnackbarProvider/SnackbarProvider";
import i18n from '../i18n';

const styles = {

}

class CreateProject extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            title: "",
            years: [],
            specializations: [],
            description: "",
            study_year: [],
            majors_concerned: [],
            files: [],
            infos: "",
            skills: "",
            keywords: [],
            multipleTeams: false,
            maxNumber: 1,
        }

        this.handleChange = this.handleChange.bind(this);
        this.handleNext = this.handleNext.bind(this);
        this.handleSpecializations = this.handleSpecializations.bind(this);
        this.setFiles = this.setFiles.bind(this);
        this.renderSelect = this.renderSelect.bind(this);
    }

    componentWillMount() {
        AuthService.fetch('/api/specialization')
            .then(res => res.json())
            .then(specializations => {
                this.setState({ specializations: specializations });
            })
            .catch(console.error.bind(console));

        AuthService.fetch('/api/year')
            .then(res => res.json())
            .then(years => {
                this.setState({ years: years })
            })
            .catch(console.error.bind(console));
    }

    setFiles = files => {
        this.setState({
            files
        });
    }

    handleSpecializations = event => {
        this.setState({ majors_concerned: event.target.value });
    };

    handleChange = e => {
        let temp;
        switch (e.target.name) {
            case "year":
                temp = this.state.study_year;
                if (e.target.checked) {
                    temp.push(e.target.value);
                }
                else {
                    let index = temp.indexOf(e.target.value)
                    if (index > -1) {
                        temp.splice(index, 1);
                    }
                }
                this.setState({ study_year: temp });
                break;

            case "spe":
                temp = this.state.majors_concerned;
                if (e.target.checked) {
                    temp.push(e.target.value);
                }
                else {
                    let index = temp.indexOf(e.target.value)
                    if (index > -1) {
                        temp.splice(index, 1);
                    }
                }
                this.setState({ majors_concerned: temp });
                break;
            case "multipleTeams":
                this.setState({
                    [e.target.name]: e.target.checked
                });
                break;
            default:
                this.setState({
                    [e.target.name]: e.target.value
                });
                break;
        }
    }

    handleKeyWords = key => this.setState({ keywords: key })

    handleNext = e => {
        if (this.state.title && this.state.study_year.length > 0 && this.state.majors_concerned.length > 0 && this.state.description) {
            let data = {
                title: this.state.title,
                study_year: this.state.study_year,
                majors_concerned: this.state.majors_concerned,
                description: this.state.description,
                skills: this.state.skills,
                infos: this.state.infos,
                maxNumber: this.state.maxNumber
            };
            if (this.state.keywords) data.keywords = this.state.keywords;
            if (this.state.files.length > 0) data.files = this.state.files.map(file => file._id);

            AuthService.fetch("/api/projects/", {
                method: "PUT",
                body: JSON.stringify(data)
            })
                .then(res => res.json())
                .then(data => {
                    if (data._id)
                        this.props.next();
                })
                .catch(err => {
                    this.props.snackbar.notification("error", i18n.t("errors.createProject", { lng: this.props.lng }));
                });
        } else {
            this.props.snackbar.notification("error", i18n.t("errors.fillAll", { lng:this.props.lng }));
        }
    }

    renderSelect(e) {
        return this.state.specializations
            // Filtre les majeures qui n'ont pas été selectionnée 
            .filter(spe => {
                if (e.indexOf(spe._id) !== -1)
                    return true;
                return false;
            })
            // Association des majeures selectionnées à leur nom
            .map(spe => {
                return this.props.lng === "fr" ? spe.name.fr : spe.name.en
            })
            // Jointure
            .join(", ");
    }

    render() {
        const { lng, classes } = this.props;
        return (
            <ValidatorForm ref="form" onSubmit={this.handleNext}>
                <Grid container direction="column" justify="center" spacing={24} className={classes.paper}>
                    <Grid item>
                        <Typography align='center' variant='h6'>{i18n.t('projectPres.h2', { lng })}</Typography>
                    </Grid>
                    <Grid item>
                        <TextValidator
                            label={i18n.t('titleproj.label', { lng })}
                            onChange={this.handleChange}
                            fullWidth={true}
                            name="title"
                            value={this.state.title}
                            validators={['required', 'maxStringLength:70']}
                            errorMessages={[i18n.t('field.label', { lng }), i18n.t('field_length.label', { lng })]}
                            variant="outlined"
                        />
                    </Grid>
                    <br />

                    <Grid item>
                        <Typography variant="subtitle1" align='center' style={{ fontWeight: "bold" }}>
                            {i18n.t('years.label', { lng })}
                        </Typography>
                        <Grid container direction="row" justify='center'>
                            {this.state.years.map(year =>
                                <Grid item key={year._id}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                onChange={this.handleChange}
                                                value={year._id}
                                                name="year"
                                            />
                                        }
                                        label={lng === "fr" ? year.name.fr : year.name.en}
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </Grid>
                    <br />

                    <Grid item>
                        <Typography variant="subtitle1" align='center' style={{ fontWeight: "bold" }}>
                            {i18n.t('majors.label', { lng })}
                        </Typography>
                        <Grid container direction="row" justify='center'>
                            {this.state.specializations.map(spe =>
                                <Grid item key={spe._id}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                onChange={this.handleChange}
                                                value={spe._id}
                                                name="spe"
                                            />
                                        }
                                        label={lng === "fr" ? spe.name.fr : spe.name.en}
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </Grid>
                    <br />
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" align='center' style={{ fontWeight: "bold" }}>
                            {i18n.t('createProject.multipleTeams', { lng })}
                        </Typography>
                        <Grid container direction="row" justify='center'>
                            <Grid item xs={4} md={2} lg={1}>
                                <Switch
                                    checked={this.state.multipleTeams}
                                    onChange={this.handleChange}
                                    name="multipleTeams"
                                    inputProps={{ 'aria-label': 'secondary checkbox' }}
                                />
                            </Grid>
                            <Grid item xs={8} md={4} lg={2}>
                                {this.state.multipleTeams &&
                                    <TextValidator
                                        label={i18n.t('createProject.maxNumber', { lng })}
                                        value={this.state.maxNumber}
                                        validators={['required', 'matchRegexp:^[0-9]+$']}
                                        errorMessages={[i18n.t('field.label', { lng }), i18n.t('errors.NaN', { lng })]}
                                        name="maxNumber"
                                        onChange={this.handleChange}
                                        fullWidth={true}
                                        variant="outlined"

                                    />
                                }
                            </Grid>
                        </Grid>

                    </Grid>
                    <br />

                    <Grid item>
                        <TextValidator
                            label={i18n.t('descriptionProj.label', { lng })}
                            value={this.state.description}
                            validators={['required', 'maxStringLength:10000']}
                            errorMessages={[i18n.t('field.label', { lng }), i18n.t('field_length.label', { lng })]}
                            multiline
                            rows="10"
                            name="description"
                            onChange={this.handleChange}
                            fullWidth={true}
                            variant="outlined"
                        />
                    </Grid>

                    <Grid item>
                        <TextValidator
                            label={i18n.t('createProject.skills', { lng })}
                            value={this.state.skills}
                            validators={['maxStringLength:250']}
                            errorMessages={[i18n.t('field.label', { lng }), i18n.t('field_length.label', { lng })]}
                            name="skills"
                            onChange={this.handleChange}
                            multiline
                            fullWidth={true}
                            variant="outlined"
                        />
                    </Grid>

                    <Grid item>
                        <TextValidator
                            label={i18n.t('createProject.infos', { lng })}
                            value={this.state.infos}
                            validators={['maxStringLength:250']}
                            errorMessages={[i18n.t('field.label', { lng }), i18n.t('field_length.label', { lng })]}
                            name="infos"
                            multiline
                            rows="2"
                            onChange={this.handleChange}
                            fullWidth={true}
                            variant="outlined"
                        />
                    </Grid>

                    <Grid item>
                        <KeyWords lng={lng} change={this.handleKeyWords} />
                    </Grid>
                    <Grid item>
                        <FilesInputs lng={lng} setFiles={this.setFiles} />
                    </Grid>
                </Grid>
                <Grid item>
                    <Grid container spacing={40} justify="center">
                        <Grid item xs={2}>
                            <Button lng={lng} variant='contained' color='primary' type="submit">
                                <Typography color="inherit">
                                    {i18n.t('deposit.label', { lng })}
                                </Typography>
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </ValidatorForm>
        );
    }
}

export default withSnackbar(withStyles(styles, { withTheme: true })(CreateProject));