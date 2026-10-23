import { Router } from 'express';
import authRoutes from './auth.js';
import productRoutes from './products.js';
import contactRoutes from './contacts.js';
import orderRoutes from './orders.js';
import regionRoutes from './regions.js';

const route = Router();

route.use('/auth', authRoutes);
route.use('/products', productRoutes);
route.use('/contacts', contactRoutes);
route.use('/orders', orderRoutes);
route.use('/regions', regionRoutes);

export default route;
