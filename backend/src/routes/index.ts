import { Router } from 'express';
import { healthRouter } from '../modules/health/health.routes.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { categoriesRouter } from '../modules/categories/categories.routes.js';
import { clientsRouter } from '../modules/clients/clients.routes.js';
import { dashboardRouter } from '../modules/dashboard/dashboard.routes.js';
import { transactionsRouter } from '../modules/transactions/transactions.routes.js';
import { moneyTransfersRouter } from '../modules/money-transfers/money-transfers.routes.js';
import { requireAdmin } from '../middleware/auth.js';

export const apiRouter = Router();
apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin/dashboard', requireAdmin, dashboardRouter);
apiRouter.use('/admin/clients', requireAdmin, clientsRouter);
apiRouter.use('/admin/categories', requireAdmin, categoriesRouter);
apiRouter.use('/admin/transactions', requireAdmin, transactionsRouter);
apiRouter.use('/admin/money-transfers', requireAdmin, moneyTransfersRouter);
