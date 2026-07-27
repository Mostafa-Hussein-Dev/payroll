# Payroll

A simple, multi-company employee payroll manager. Built with **Next.js (App Router)**,
**PostgreSQL** and **Prisma**. The data model mirrors a Lebanese monthly salary sheet
(NSSF / الضمان, allowances, loans, net due) but supports **many companies**, each with
its own employees and monthly payroll runs.

## Features

- Simple email/password login (one admin manages everything)
- Multiple companies, each with its own currency and NSSF rate
- Employee master records: base salary, transport & family allowances, NSSF flag,
  loan balance, start date
- Monthly **payroll runs** that auto-generate a payslip per active employee
- Editable payslips with earnings & deductions and a live **net due** (المستحق للدفع)
- **Finalize** a run to lock it and apply loan payments to employee balances

## Prerequisites

- Node.js 18+
- A running PostgreSQL database

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   then edit .env and set DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

# 3. Create the database schema
npx prisma migrate dev --name init

# 4. Seed the admin user (and a demo company)
npm run db:seed

# 5. Start the app
npm run dev
```

Open http://localhost:3000 and sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD`
from your `.env`.

## No local Postgres?

Spin one up with Docker:

```bash
docker run --name payroll-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=payroll \
  -p 5432:5432 -d postgres:16
```

This matches the default `DATABASE_URL` in `.env.example`.

## Payslip formula

```
earnings   = salary + transport + family + overtime + salaryAdjAddition + otherAdditions
deductions = nssf + nssfDifference + absence + salaryAdjDeduction + purchases + advance + loanPayment
net due    = earnings − deductions
```

## Project structure

```
prisma/schema.prisma   Database models (Company, Employee, PayrollRun, Payslip, User)
src/lib/               prisma client, auth, payroll math, formatting, server actions
src/app/login          Login screen
src/app/(app)          Authenticated app: companies, employees, payroll runs
```
