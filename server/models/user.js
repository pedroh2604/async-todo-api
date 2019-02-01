const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var UserSchema = new mongoose.Schema({
	// User model
	email: {
		type: String,
		required: true, 
		minlength: 1,
		trim: true,
		unique: true,
		validate: {
			validator: validator.isEmail,
			message: '{VALUE} is not a valid email'
		}
	},
	password: {
		type: String,
		required: true,
		minlength: 6
	},
	tokens: [{
		access: {
			type: String, 
			required: true
		},
		token: {
			type: String, 
			required: true
		}
	}]
});

// only returns the id and email, not the password and token
UserSchema.methods.toJSON = function () {
	var user = this;
	var userObject = user.toObject();

	return _.pick(userObject, ['_id', 'email']);
};

// adds the Token generator method to the UserSchema object
UserSchema.methods.generateAuthToken = function () {
	var user = this;
	var access = 'auth';
	var token = jwt.sign({_id: user._id.toHexString(), access}, process.env.JWT_SECRET).toString();

	user.tokens = user.tokens.concat([{access, token}]);

	return user.save().then(() => {
		return token;
	});
};

// removes the generator token from the UserSchema object
UserSchema.methods.removeToken = function (token) {
	var user = this;

	// if the token matches one in the array of tokens, removes it
	return user.update({
		$pull: {
			tokens: {token}
		}
	});
};

// finds an user by token on /users/me/x-auth
UserSchema.statics.findByToken = function (token) {
	var User = this;
	var decoded;

	try {
		decoded = jwt.verify(token, process.env.JWT_SECRET);
	} catch(e) {
		// return new Promise((resolve, reject) ={
		// 	reject();
		// });
		return Promise.reject();
	}

	return User.findOne({
		'_id': decoded._id,
		'tokens.token': token,
		'tokens.access': 'auth'
	});
}

// used to login, checks email and password
UserSchema.statics.findByCredentials = function (email, password) {
	var User = this;

	// checks if the email is in the user collection
	return User.findOne({email}).then((user) => {
		if (!user) {
			return Promise.reject();
		}

		return new Promise((resolve, reject) => {
			// compare the password and it's token
			bcrypt.compare(password, user.password, (err, res) => {
				if (res) {
					resolve(user);
				} else {
					reject();
				}
			});
		});
	});
};

// mongoose middleware... checks if the password is correct before storing the user to the database
UserSchema.pre('save', function (next) {
	var user = this;

	if (user.isModified('password')) {
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(user.password, salt, (err, hash) => {
				user.password = hash;
				next();
			});
		});
	} else {
		next();
	}
});	

var User = mongoose.model('User', UserSchema);

module.exports = {User};