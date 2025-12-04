# WhelHost - Hotel Reservation Management System

A comprehensive hotel reservation management system built with Next.js and Supabase, featuring Moyasar payment integration for secure payment processing.

## Features

- Room and unit management
- Real-time booking calendar
- Advanced analytics and reports
- Smart lock integration
- Guest communication tools
- Invoice generation and payment processing
- Channel management
- Task management for staff
- Priority support

## Payment Integration

The system includes integration with **Moyasar** payment gateway, supporting multiple payment methods:
- Credit cards (Visa, Mastercard, MADA)
- STC Pay
- Other redirect-based payment methods

## Tech Stack

- **Frontend**: Next.js 16
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS with shadcn/ui components
- **Payment**: Moyasar API
- **Deployment**: Vercel (via Nixpacks)

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Configure your Supabase credentials
3. Add your Moyasar API keys
4. For development, use test keys; for production, use live keys

## Development

```bash
npm install
npm run dev
```

## Documentation

For detailed information about the Moyasar integration, see [docs/MOYASAR_INTEGRATION.md](docs/MOYASAR_INTEGRATION.md).

## Deployment

This app is configured for deployment on Vercel. Simply connect your repository to Vercel and configure the required environment variables.



in the billings repports make if the owner will add billings make the date
    with calendry and categories (he must write ore selet for service     

    "londering ,coffe shop,restaurent,parking , gyme , wifi"  and
    selectcategorie ore write categorie and remplire the number and the price
    and the total tq total is the numer * price and he termine the added show
    popape write "create the billing succesfull and show in the popape the

  date
     and the number of the billing and total and imprime and continue ore 
    Creating a receipt"  and if he click in the Creating a receipt open a 
    formulaire il faut le remplire contien"Payment of amount,methode of   
  payment
     (cashe ore transaction banker ore payment card) and also remarque  " 

  and
     give me the code dans sql pour modifier les tableux de supabase si il ya

    des modifications
