import express from 'express';
import ParsonsProblems from '../../database/ProblemSchema';
import Users from '../../database/UserSchema';
import Courses from '../../database/CourseSchema';

const router = express.Router();

// Get a list of all problems in the database
router.get('/', async (req, res) => {
  try {
    const problems = await ParsonsProblems.find({});
    res.json(problems);
  } catch (error) {
    console.log('[student.js]>', error);
    res.status(500).json('An issue has occured on the server end');
  }
});

// Get a list of problems for a specific group/course
router.get('/problems/:group', async (req, res) => {
  const { group } = req.params;
  try {
    const course = await Courses.findOne({ groupNumber: group });
    const problems = await ParsonsProblems.find({ _id: { $in: [...course.problems] } });
    if (!problems) {
      res.json([]);
    }
    res.json(problems);
  } catch (error) {
    console.log('[student.js]>', error);
    res.status(500).json('An issue has occured on the server end');
  }
});

// Get a list of all users in the database
router.get('/all', async (req, res) => {
  try {
    const users = await Users.find({});
    res.json(users);
  } catch (error) {
    console.log('[student.js]>', error);
    res.status(500).json('An issue has occured on the server end');
  }
});

// Get a particular student based on their email
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await Users.findOne({ email: id });
    if (user) {
      console.log(`[student.js]> Student '${id}' found`);
      res.json(user);
    } else {
      // Respond with 404 Not Found if user id not found
      console.log(`[student.js]> Student with ${id} not found`);
      res.sendStatus(404);
    }
  } catch (error) {
    // Respond with 400 Bad Request if id causes exception
    console.log('[student.js]>', error);
    res.status(400).json(error);
  }
});

// Create a new user
router.post('/new', async (req, res) => {
  const { result, error } = await createNewUser(req.body);

  if (result) {
    console.log('[student.js]> New User record: ', result);
    res.status(201).header('location', `/student/${result._id}`).send();
  } else {
    console.log('[student.js]>', error);
    res.status(500).json(error);
  }
});

// Get a group number for a new student
const getGroupNumber = async () => {
  const userNumber = await Users.countDocuments({ roles: { $size: 1 }, roles: ['student'] });
  return (userNumber % 4) + 1;
};

const createNewUser = async (obj) => {
  let err = '';
  console.log('[createNewUser] ', obj);
  try {
    if (obj.email === undefined || obj.email === null) {
      err = 'Invalid or Missing email';
    }

    if (err !== '') {
      return { result: false, error: err };
    }

    const groupNumber = await getGroupNumber();
    obj.experimentGroup = groupNumber;
    console.log('[student.js]> New User:', obj);
    const newUser = new Users(obj);
    await newUser.save();
    return { result: newUser, error: err };
  } catch (error) {
    return { result: false, error: error };
  }
};

export default router;
