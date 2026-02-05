import express from 'express';
import { createGig, getGigs, deleteGig } from '../controllers/gigControllers.js';
import userAuth from '../middleware/userAuth.js';

const gigRouter = express.Router();

//public
gigRouter.get('/', getGigs);

//private
gigRouter.post('/', userAuth, createGig);

gigRouter.delete('/:id', userAuth, deleteGig);

export default gigRouter;
