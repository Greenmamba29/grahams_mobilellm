'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Building, Crown } from '@phosphor-icons/react';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  priceId: string; // Stripe price ID
  icon: React.ReactNode;
  popular?: boolean;
  description: string;
  features: string[];
  queryLimit: number;
  buttonText: string;
  buttonVariant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: '',
    icon: <Zap className="h-6 w-6" />,
    description: 'Perfect for trying out our AI search capabilities',
    queryLimit: 100,
    features: [
      '100 queries per month',
      'Basic search functionality',
      'Standard response time',
      'Community support',
      'Web interface access',
      'Basic function calling (maps, shopping)',
    ],
    buttonText: 'Get Started Free',
    buttonVariant: 'outline'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    priceId: 'price_pro_monthly',
    icon: <Crown className="h-6 w-6" />,
    popular: true,
    description: 'For developers and researchers who need more power',
    queryLimit: 2000,
    features: [
      '2,000 queries per month',
      'Advanced search with function calling',
      'Priority response time',
      'Email support',
      'API access with rate limits',
      'Custom model selection',
      'Image generation (50/month)',
      'Advanced analytics dashboard',
      'Export results to CSV/JSON',
    ],
    buttonText: 'Start Pro Trial',
    buttonVariant: 'default'
  },
  {
    id: 'team',
    name: 'Team',
    price: 99,
    priceId: 'price_team_monthly',
    icon: <Building className="h-6 w-6" />,
    description: 'For teams that need collaboration and higher limits',
    queryLimit: 10000,
    features: [
      '10,000 queries per month',
      'Everything in Pro',
      'Team collaboration features',
      'Up to 10 team members',
      'Advanced API access',
      'Custom integrations',
      'Priority support',
      'Team analytics and reporting',
      'Shared query history',
      'Role-based access control',
    ],
    buttonText: 'Start Team Trial',
    buttonVariant: 'default'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499,
    priceId: 'price_enterprise_monthly',
    icon: <Building className="h-6 w-6" />,
    description: 'For large organizations with custom requirements',
    queryLimit: -1, // Unlimited
    features: [
      'Unlimited queries',
      'Everything in Team',
      'Single Sign-On (SSO)',
      'Advanced security features',
      'On-premise deployment option',
      'Custom model fine-tuning',
      'Dedicated support manager',
      '99.9% SLA guarantee',
      'Custom integrations',
      'Advanced audit logging',
      'Compliance support (SOC2, GDPR)',
    ],
    buttonText: 'Contact Sales',
    buttonVariant: 'outline'
  }
];

export default function PricingTable() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: PricingPlan) => {
    if (plan.id === 'free') {
      // Redirect to signup for free plan
      window.location.href = '/signup?plan=free';
      return;
    }

    if (plan.id === 'enterprise') {
      // Redirect to contact form for enterprise
      window.location.href = '/contact?plan=enterprise';
      return;
    }

    setLoadingPlan(plan.id);
    
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          isAnnual,
        }),
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setLoadingPlan(null);
    }
  };

  const getPrice = (plan: PricingPlan) => {
    if (plan.price === 0) return 'Free';
    
    const price = isAnnual ? plan.price * 10 : plan.price; // 2 months free with annual
    return `$${price}`;
  };

  const getPeriod = () => {
    return isAnnual ? '/year' : '/month';
  };

  return (
    <div className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Start free, scale as you grow. No hidden fees.
          </p>
          
          {/* Billing toggle */}
          <div className="mt-8 flex justify-center">
            <div className="relative flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setIsAnnual(false)}
                className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  !isAnnual
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  isAnnual
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Annual
                <Badge className="ml-2" variant="secondary">
                  Save 17%
                </Badge>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular
                  ? 'border-blue-500 shadow-blue-500/25 shadow-lg scale-105'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="pb-8 pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {plan.icon}
                    <CardTitle className="ml-2 text-lg">{plan.name}</CardTitle>
                  </div>
                </div>
                
                <div className="mt-4">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">
                    {getPrice(plan)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-base font-medium text-gray-500">
                      {getPeriod()}
                    </span>
                  )}
                </div>
                
                <p className="mt-4 text-sm text-gray-500">
                  {plan.description}
                </p>
              </CardHeader>
              
              <CardContent className="pt-0">
                <Button
                  className="w-full mb-6"
                  variant={plan.buttonVariant}
                  onClick={() => handleSubscribe(plan)}
                  disabled={loadingPlan === plan.id}
                >
                  {loadingPlan === plan.id ? 'Loading...' : plan.buttonText}
                </Button>
                
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {plan.queryLimit > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Query Limit</span>
                      <span className="font-medium">
                        {plan.queryLimit.toLocaleString()}/month
                      </span>
                    </div>
                  </div>
                )}
                
                {plan.queryLimit === -1 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Query Limit</span>
                      <span className="font-medium text-green-600">Unlimited</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-gray-600">
            All plans include our core AI search features. Upgrade or downgrade anytime.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Questions? <a href="/contact" className="text-blue-600 hover:text-blue-500">Contact our sales team</a>
          </p>
        </div>
      </div>
    </div>
  );
}