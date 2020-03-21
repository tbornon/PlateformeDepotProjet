'use strict';

const mongoose = require('mongoose');
const Partner = mongoose.model('Partner');
const crypto = require('crypto');
const sha256 = require('js-sha256')
const jwt = require('jsonwebtoken');

const { emitter } = require('../../eventsCommon');
const config = require('../../config');

exports.listAllPartners = function (req, res) {
	if (req.user.__t == "EPGE") {
		Partner.find()
			.populate('projects')
			.exec((err, partner) => {
				if (err)
					res.send(err);
				res.json(partner);
			});
	} else if (req.user.__t == "Partner") {
		Partner.findById(req.user._id)
			.populate({
				path: 'projects',
				populate: {
					path: "specializations.specialization study_year"
				}
			})
			.exec((err, partner) => {
				if (err) res.send(err);
				else res.json(partner);
			});
	}
};

exports.addProject = (partnerId, projectId) => {
	return new Promise((resolve, reject) => {
		Partner.findByIdAndUpdate(partnerId, { $push: { projects: projectId } }, { new: true }, (err, partner) => {
			if (err) reject(err);
			else {
				emitter.emit("projectSubmitted", { partner: partner });
			}
		});
	});
}

exports.createPartner = (req, res, next) => {
	const data = req.body;

	if (data.first_name && data.last_name && data.email && data.company && data.kind && data.alreadyPartner !== undefined) {
		Partner.findOne({ email: data.email }, async (err, partner) => {
			if (err) next(err);
			else {
				if (partner) {
					let error = new Error("Email already used by a partner");
					error.name = "EmailUsed";
					next(error);
				} else {
					let newPartner = new Partner({
						first_name: data.first_name,
						last_name: data.last_name,
						email: data.email,
						alreadyPartner: data.alreadyPartner,
						kind: data.kind,
						company: data.company
					});

					if (data.address) newPartner.company = data.address;
					if (data.phone) newPartner.phone = data.phone;

					generatePassword(16)
						.then(keyData => {
							newPartner.key = keyData.hash;

							newPartner.save(err => {
								if (err) next(err);
								else {
									let userToken = jwt.sign(
										{ id: newPartner._id },
										config.jwt.secret,
										{
											expiresIn: 60 * 60 * 24
										}
									);

									res.json({ partner: newPartner, token: userToken });

									emitter.emit("partnerCreated", { partner: newPartner, key: keyData.key });
								}
							});
						})
						.catch(err => {
							next(err);
						});
				}
			}
		});
	} else {
		next(new Error("Invalid parameters. Missing one of these aruguments : first_name, last_name, email or company"));
	}
};

exports.findByMail = (req, res) => {
	if (req.params.email) {
		Partner.findOne({ email: req.params.email })
			.populate('projects')
			.exec((err, partner) => {
				if (err)
					res.send(err);
				if (!partner)
					res.json({});
				else
					res.json(partner);
			});
	} else {
		res.send(new Error("Missing email argument"));
	}
}

exports.findById = (req, res) => {
	Partner.findOne({ _id: req.params.id })
		.populate('projects')
		.exec((err, partner) => {
			if (err)
				res.send(err);
			if (!partner)
				res.json({});
			else
				res.json(partner);
		});
}

exports.findByKey = (req, res) => {
	Partner.findOne({ key: req.params.key })
		.populate('projects')
		.exec((err, partner) => {
			if (err)
				res.send(err);
			if (!partner)
				res.json({});
			else
				res.json(partner);
		})
}

exports.updatePartner = (req, res) => {
	Partner.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true }, (err, partner) => {
		if (err) {
			res.send(err);
		}
		res.json(partner);
	});
}

exports.deletePartner = (req, res) => {
	Partner.findByIdAndRemove(req.params.id, function (err, note) {
		if (err) {
			if (err.kind === 'ObjectId') {
				return res.status(404).send({ message: "Partner not found with id " + req.params.id });
			}
			return res.status(500).send({ message: "Could not delete Partner with id " + req.params.id });
		}

		if (!note) {
			return res.status(404).send({ message: "Partner not found with id " + req.params.id });
		}

		res.send({ message: "Partner deleted successfully!" })
	});
}

exports.resetPassword = (req, res, next) => {
	const data = req.body;
	if (data.email) {
		Partner.findOne({ email: data.email }, (err, partner) => {
			if (partner) {
				generatePassword(16)
					.then(pass => {
						partner.key = pass.hash;

						partner.save(err => {
							if (err) next(err);
							else {
								res.json({ done: 1 });

								emitter.emit("resetLink", { key: pass.key, partner: partner });
							}
						});
					})
					.catch(next);
			}
			else {
				next(new Error("PartnerNotFound"));
			}
		});
	} else {
		next(new Error('MissingParameter'));
	}
}

function generatePassword(size) {
	return new Promise((resolve, reject) => {
		crypto.randomBytes(size / 2, function (err, buffer) {
			if (err) reject(err);
			const key = buffer.toString('hex');
			const keyHash = sha256(key);

			// Prevent key collision
			Partner.countDocuments({ key: keyHash }, (err, count) => {
				if (err) reject(err);
				if (count == 0) resolve({ key: key, hash: keyHash });
				else reject(new Error("KeyCollision"));
			});
		});
	});
}