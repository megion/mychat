function User(username) {
	this.username = username; // str
	this.hashedPassword = null; // str
	this.salt = null; // str
}

exports.User = User;
