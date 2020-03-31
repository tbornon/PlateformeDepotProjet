import React from "react";
import PropTypes from 'prop-types';

// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

// core components
import GridItem from "components/Grid/GridItem.jsx";
import GridContainer from "components/Grid/GridContainer.jsx";
import Card from "components/Card/Card.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardBody from "components/Card/CardBody.jsx";
import CardFooter from "components/Card/CardFooter.jsx";

import AuthService from "components/AuthService"
import { api } from "../../config"

const styles = {
    cardCategoryWhite: {
        color: "rgba(255,255,255,.62)",
        margin: "0",
        fontSize: "14px",
        marginTop: "0",
        marginBottom: "0"
    },
    cardTitleWhite: {
        color: "#FFFFFF",
        marginTop: "0px",
        minHeight: "auto",
        fontWeight: "300",
        fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        marginBottom: "3px",
        textDecoration: "none"
    },
    displayLineBreak: {
        "white-space": "pre-line"
    }
};

class Years extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            years: [],
            checkedYears: [],
            loadingYear: true
        }
    }

    componentWillMount() {
        this.loadStaticData();
    }

    loadStaticData() {
        fetch(api.host + ":" + api.port + "/api/year")
            .then(res => res.json())
            .then(years => {
                let checkedYears = {};

                years.forEach(year => {
                    checkedYears[year._id] = false;
                });

                this.setState({
                    years: years,
                    checkedYears: checkedYears,
                    loadingYear: false,
                    studyYears: this.props.studyYears,
                }, this.checkboxMapping);
            });
    }

    checkboxMapping() {
        if (!this.state.loadingYear) {
            let checkedYears = {};

            let yearsConcerned = this.state.studyYears.map(year => year._id);

            this.state.years.forEach(year => {
                if (yearsConcerned.indexOf(year._id) !== -1) checkedYears[year._id] = true;
                else checkedYears[year._id] = false;
            });

            this.setState({
                checkedYears: checkedYears
            });
        }
    }

    handleCheckboxChange = event => {
        const checked = event.target.checked;
        const id = event.target.id;

        // Count the number of checkbox checked
        let checkedCount = 0;
        for (const id in this.state.checkedYears)
            if (this.state.checkedYears[id])
                checkedCount++;

        // If there is at least 2 checkbox checked or the checkbox is getting checked
        if (checkedCount >= 2 || checked) {
            let yearList = [];

            for (let yearId in this.state.checkedYears)
                // uncheck if checked || check if unchecked
                if ((this.state.checkedYears[yearId] && yearId !== id) || (!this.state.checkedYears[yearId] && yearId === id))
                    yearList.push(yearId);

            const data = {
                _id: this.props.projectId,
                study_year: yearList
            }

            AuthService.fetch(api.host + ":" + api.port + "/api/projects", {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data)
            })
                .then(res => {
                    if (!res.ok) throw res;
                    else return res.json()
                })
                .then(data => {
                    this.setState({
                        studyYears: data.study_year
                    });
                    this.checkboxMapping();
                })
                .catch(err => {
                    this.setState({
                        error: true,
                        message: "Une erreur est survenue lors de la sauvegarde des données."
                    });
                    console.error(err);
                });
        } else {
            this.setState({
                error: true,
                message: "Le projet doit à minima concerner à une année."
            }, () => {
                setTimeout(() => {
                    this.setState({
                        error: false
                    });
                }, 2500);
            });
        }
    }

    render() {
        const { classes, color } = this.props;
        return (
            <Card>
                <CardHeader color={color}>
                    <h4 className={classes.cardTitleWhite}>Années</h4>
                    <p className={classes.cardCategoryWhite}>Années concernées par le projet</p>
                </CardHeader>
                <CardBody>
                    <GridContainer>
                        <GridItem xs={12} md={12}>
                            <GridContainer alignItems="center" justify="center">
                                {this.state.years.map(year =>
                                    <GridItem xs={12} md={3} key={year._id}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    onChange={this.handleCheckboxChange}
                                                    checked={this.state.checkedYears[year._id]}
                                                    id={year._id}
                                                    disabled={this.props.projectStatus !== "pending"}
                                                    color="primary"
                                                />
                                            }
                                            label={year.name.fr}
                                        />
                                    </GridItem>
                                )}
                            </GridContainer>
                        </GridItem>
                    </GridContainer>
                </CardBody>
                <CardFooter>
                </CardFooter>
            </Card >
        );
    }
}

Years.propTypes = {
    color: PropTypes.string.isRequired,
    projectId: PropTypes.string.isRequired,
    projectStatus: PropTypes.string.isRequired,
    studyYears: PropTypes.array.isRequired,
}

export default withStyles(styles)(Years);