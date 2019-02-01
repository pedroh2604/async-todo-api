const {ObjectID} = require('mongodb');

const {mongose} = require('./../server/db/mongoose');
const {Todo} = require('./../server/models/todo');
const {User} = require('./../server/models/user');

// Todo.remove({})

// Todo.remove({}).then((result) => {
// 	console.log(result);
// });

//Todo.findOneAndRemove
// Todo.findByIdAndRemove

Todo.findOneAndRemove({_id: '5c44c82bbdceff8d8034e74f'}).then((todo) => {
	console.log(todo);
});

Todo.findByIdAndRemove('5c44c82bbdceff8d8034e74f').then((todo) => {
	console.log(todo);
});