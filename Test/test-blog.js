const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const {BlogPost} = require('../models');
const {runServer, app, closeServer} = require('../server');
const {TEST_DATABASE_URL, PORT} = require('../config');
const should = chai.should();

chai.use(chaiHttp);

function seedBlogData() {
  console.info('seeding restaurant data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    seedData.push(generateBlogData());
  }
  // this will return a promise
  return BlogPost.insertMany(seedData);
}

function generateBlogData() {
  return {
    author: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName()
    },
    title: faker.lorem.words(),
    content: faker.lorem.paragraph()
  }; 
}

function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

describe('Restaurants API resource', function() {

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedBlogData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  //Start Endpoints Here


  describe('GET endpoints', function(){

    it('should respond with all items in the collection', function(){
      let res;
      return chai.request(app)
      .get('/posts')
      .then(result => {
        res = result;
        result.body.should.be.a('array');
        result.should.have.status(200);
        return BlogPost.count();
      })
      .then(count => res.body.should.have.length.of(count));
    });

    it.only('should return items with all the correct fields', function(){
      let res;
      return chai.request(app)
      .get('/posts')
      .then(result => {
        result.should.have.status(200);
        result.should.be.json;
        result.body.should.have.length.of.at.least(1);
        result.body.should.be.a('array');

        result.body.forEach(post => {
          post.should.be.a('object');
          post.should.include.keys('id', 'title', 'content', 'author');
        });
        res = result.body[0];
        return BlogPost.findById(res.id);
      })
      .then(post => {
        console.log(res);
        console.log(post);
        res.id.should.equal(post.id);
        res.title.should.equal(post.title);
        res.author.should.equal(post.authorName);
        res.content.should.equal(post.content);
      });
    });
    it('should return only the item corresponding to the ID in the parameters', function(){
      let res;
      return BlogPost
      .findOne({})
      .then(result =>{
        res = result;
        return chai.request(app)
        .get(`/posts/${res.id}`);
      })
      .then(post =>{
        res.id.should.equal(post.body.id);
        res.title.should.equal(post.body.title);
        res.authorName.should.equal(post.body.author);
        res.content.should.equal(post.body.content);

      });
    });


  });

  describe('POST endpoint', function(){
    it('should add a new post', function() {
      const newPost = generateBlogData();
        
      return chai.request(app)
        .post('/posts')
        .send(newPost)
        .then(result => {
          result.should.have.status(201);
          result.should.be.json;
          result.should.be.a('object');
          result.body.should.include.keys('id', 'title', 'author', 'content');
          result.body.id.should.not.be.null;

          return BlogPost.findById(result.body.id);
        })
        .then(post => {
          post.title.should.equal(newPost.title);
          post.content.should.equal(newPost.content);
          post.author.firstName.should.equal(newPost.author.firstName);
          post.author.lastName.should.equal(newPost.author.lastName);
        });
    });
  });
  describe('PUT endpoint', function(){
    it('should update and return the item who\'s ID was passed in through params', function(){
      let randomItem = generateBlogData();
      let dbItem;
      return BlogPost
        .findOne({})
        .then(result => {
          dbItem = result;
          randomItem.id = result.id;
          return chai.request(app)
          .put(`/posts/${result.id}`)
          .send(randomItem);
        })
        .then(result =>{
          result.body.id.should.equal(dbItem.id);
          result.body.title.should.equal(randomItem.title);
          result.body.content.should.equal(randomItem.content);
          result.body.author.should.equal(`${randomItem.author.firstName} ${randomItem.author.lastName}`);
        });
    });
  });

  describe('DELETE endpoint', function(){
    it('Should Delete item by ID which was passed in through params', function() {
      let post;
      return BlogPost
        .findOne()
        .then(result => {
          post = result;
          return chai.request(app)
          .delete(`/posts/${post.id}`);
        })
        .then(result => {
          result.should.have.status(204);
          return BlogPost.findById(post.id);
        })
        .then(result => {
          should.not.exist(result);
        });

    });
  });

}); // End of parent describe