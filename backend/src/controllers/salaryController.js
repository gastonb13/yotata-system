const { SalaryPayment, Employee, User, ActivityLog, sequelize } = require('../models/SalaryPayment');
const { Op } = require('sequelize');



class SalaryController {
    async getAllSalaries(req, res) {
        try {
            const { page = 1, limit = 10, employee_id, month_year } = req.query;
            const offset = (page - 1) * limit;

            const where = {};
            if (employee_id) where.employee_id = employee_id;
            if (month_year) {
                const date = new Date(month_year);
                where.paid_date = {
                    [Op.between]: [
                        new Date(date.getFullYear(), date.getMonth(), 1),
                        new Date(date.getFullYear(), date.getMonth() + 1, 0)
                    ]
                };
            }

            const salaries = await SalaryPayment.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset: parseInt(offset),
                include: [
                    { 
                        model: Employee, 
                        as: 'employee',
                        include: [{ model: User, as: 'user', attributes: ['email'] }]
                    }
                ],
                order: [['paid_date', 'DESC']]
            });

            res.json({
                success: true,
                salaries: salaries.rows,
                total: salaries.count,
                page: parseInt(page),
                totalPages: Math.ceil(salaries.count / limit)
            });
        } catch (error) {
            console.error('Get salaries error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching salaries'
            });
        }
    }

    async processSalary(req, res) {
        try {
            const { employee_id, month_year, bonuses, deductions, notes } = req.body;

            const employee = await Employee.findByPk(employee_id);
            if (!employee) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
            }

            // Check if salary already processed for this month
            const existingSalary = await SalaryPayment.findOne({
                where: {
                    employee_id,
                    paid_date: {
                        [Op.between]: [
                            new Date(month_year.getFullYear(), month_year.getMonth(), 1),
                            new Date(month_year.getFullYear(), month_year.getMonth() + 1, 0)
                        ]
                    }
                }
            });

            if (existingSalary) {
                return res.status(400).json({
                    success: false,
                    message: 'Salary already processed for this month'
                });
            }

            const baseSalary = parseFloat(employee.base_salary);
            const bonusAmount = parseFloat(bonuses) || 0;
            const deductionAmount = parseFloat(deductions) || 0;
            const netSalary = baseSalary + bonusAmount - deductionAmount;

            const salary = await SalaryPayment.create({
                employee_id,
                month_year,
                base_salary: baseSalary,
                bonuses: bonusAmount,
                deductions: deductionAmount,
                net_salary: netSalary,
                paid_date: new Date(),
                notes
            });

            await ActivityLog.create({
                user_id: req.user.id,
                action: 'PROCESS_SALARY',
                details: JSON.stringify({ 
                    employee_id, 
                    amount: netSalary,
                    month: month_year 
                }),
                ip_address: req.ip
            });

            res.status(201).json({
                success: true,
                message: 'Salary processed successfully',
                salary
            });
        } catch (error) {
            console.error('Process salary error:', error);
            res.status(500).json({
                success: false,
                message: 'Error processing salary'
            });
        }
    }

    async getSalaryStats(req, res) {
        try {
            const currentYear = new Date().getFullYear();
            
            const monthlySalaries = await SalaryPayment.findAll({
                attributes: [
                    [sequelize.fn('MONTH', sequelize.col('paid_date')), 'month'],
                    [sequelize.fn('SUM', sequelize.col('net_salary')), 'total']
                ],
                where: {
                    paid_date: {
                        [Op.between]: [`${currentYear}-01-01`, `${currentYear}-12-31`]
                    }
                },
                group: [sequelize.fn('MONTH', sequelize.col('paid_date'))],
                order: [[sequelize.fn('MONTH', sequelize.col('paid_date')), 'ASC']]
            });

            const totalSalariesYear = await SalaryPayment.sum('net_salary', {
                where: {
                    paid_date: {
                        [Op.between]: [`${currentYear}-01-01`, `${currentYear}-12-31`]
                    }
                }
            });

            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            const lastMonthSalaries = await SalaryPayment.sum('net_salary', {
                where: {
                    paid_date: {
                        [Op.between]: [
                            new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
                            new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
                        ]
                    }
                }
            });

            res.json({
                success: true,
                stats: {
                    yearlyTotal: totalSalariesYear || 0,
                    lastMonthTotal: lastMonthSalaries || 0,
                    monthlyBreakdown: monthlySalaries
                }
            });
        } catch (error) {
            console.error('Get salary stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching salary statistics'
            });
        }
    }
}

module.exports = new SalaryController();