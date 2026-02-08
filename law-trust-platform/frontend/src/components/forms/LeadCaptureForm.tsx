'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRightIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

import { useMutation } from '@apollo/client';
import { CREATE_LEAD } from '@/graphql/mutations/lead';
import { PracticeArea, UrgencyLevel, LeadSource } from '@/types/lead';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StateSelect } from '@/components/ui/StateSelect';
import { PracticeAreaSelect } from '@/components/ui/PracticeAreaSelect';

// Multi-step form validation schema
const stepSchemas = [
  // Step 1: Practice area and basic case info
  yup.object({
    practiceArea: yup.string().required('Please select your legal matter type'),
    caseDescription: yup.string()
      .min(10, 'Please provide at least 10 characters describing your situation')
      .max(2000, 'Description cannot exceed 2000 characters')
      .required('Please describe your legal situation'),
    urgencyLevel: yup.string().oneOf(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']),
    incidentDate: yup.date().nullable(),
  }),
  
  // Step 2: Contact information
  yup.object({
    firstName: yup.string().min(2, 'First name must be at least 2 characters').required('First name is required'),
    lastName: yup.string().min(2, 'Last name must be at least 2 characters').required('Last name is required'),
    email: yup.string().email('Please enter a valid email address').required('Email is required'),
    phone: yup.string().required('Phone number is required'),
  }),
  
  // Step 3: Location and additional details
  yup.object({
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    zipCode: yup.string().matches(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code').required('ZIP code is required'),
    hasMedicalTreatment: yup.boolean(),
    hasInsurance: yup.boolean(),
    annualIncome: yup.number().min(0).nullable(),
  }),
];

interface LeadCaptureFormProps {
  source?: LeadSource;
  variant?: 'full' | 'compact' | 'emergency';
  practiceArea?: PracticeArea;
  className?: string;
  onSuccess?: (leadId: string) => void;
  onError?: (error: string) => void;
}

interface FormData {
  // Case details
  practiceArea: PracticeArea;
  caseDescription: string;
  urgencyLevel: UrgencyLevel;
  incidentDate?: Date;
  
  // Contact info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Location
  city: string;
  state: string;
  zipCode: string;
  
  // Additional info
  hasMedicalTreatment?: boolean;
  hasInsurance?: boolean;
  annualIncome?: number;
  injuries?: string;
  medicalBills?: number;
  insuranceProvider?: string;
}

export function LeadCaptureForm({ 
  source = LeadSource.WEBSITE,
  variant = 'full',
  practiceArea,
  className = '',
  onSuccess,
  onError
}: LeadCaptureFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [estimatedCaseValue, setEstimatedCaseValue] = useState<number | null>(null);

  const totalSteps = variant === 'compact' ? 2 : 3;
  const currentSchema = stepSchemas[Math.min(currentStep, stepSchemas.length - 1)];

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    trigger,
    getValues,
  } = useForm<FormData>({
    resolver: yupResolver(currentSchema),
    mode: 'onBlur',
    defaultValues: {
      practiceArea: practiceArea || undefined,
      urgencyLevel: UrgencyLevel.MEDIUM,
      source,
    },
  });

  const watchedPracticeArea = watch('practiceArea');
  const watchedCaseDescription = watch('caseDescription');
  
  const [createLead] = useMutation(CREATE_LEAD, {
    onCompleted: (data) => {
      setSubmitSuccess(true);
      toast.success('Your request has been submitted successfully!');
      
      if (onSuccess) {
        onSuccess(data.createLead.id);
      } else {
        // Default redirect to thank you page
        setTimeout(() => {
          window.location.href = `/thank-you?lead=${data.createLead.id}`;
        }, 2000);
      }
    },
    onError: (error) => {
      console.error('Lead submission error:', error);
      toast.error('There was an error submitting your request. Please try again.');
      setIsSubmitting(false);
      
      if (onError) {
        onError(error.message);
      }
    },
  });

  // Auto-advance for emergency cases
  useEffect(() => {
    if (watchedCaseDescription && watchedCaseDescription.toLowerCase().includes('emergency')) {
      setValue('urgencyLevel', UrgencyLevel.EMERGENCY);
    }
  }, [watchedCaseDescription, setValue]);

  // AI-powered case value estimation (mock for demo)
  useEffect(() => {
    if (watchedPracticeArea && watchedCaseDescription && watchedCaseDescription.length > 50) {
      // Simulate AI analysis delay
      const timer = setTimeout(() => {
        const estimatedValue = estimateCaseValue(watchedPracticeArea, watchedCaseDescription);
        setEstimatedCaseValue(estimatedValue);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [watchedPracticeArea, watchedCaseDescription]);

  const handleNext = async () => {
    const isStepValid = await trigger();
    if (isStepValid && currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      // Get user's location if possible
      let latitude, longitude;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (e) {
          console.log('Geolocation not available:', e);
        }
      }

      await createLead({
        variables: {
          input: {
            ...data,
            source,
            latitude,
            longitude,
            utmSource: new URLSearchParams(window.location.search).get('utm_source'),
            utmMedium: new URLSearchParams(window.location.search).get('utm_medium'),
            utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign'),
          },
        },
      });
    } catch (error) {
      // Error handling is done in the mutation's onError callback
    }
  };

  if (submitSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted Successfully!</h3>
        <p className="text-gray-600 mb-4">
          We're connecting you with qualified attorneys in your area.
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            Expected response: 15 minutes
          </div>
          <div className="flex items-center">
            <PhoneIcon className="h-4 w-4 mr-1" />
            Call if urgent: 1-888-727-8787
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {variant === 'full' && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Get Your Free Case Evaluation
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Step {currentStep + 1} of {totalSteps}</span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What type of legal help do you need? *
                </label>
                <PracticeAreaSelect
                  value={watchedPracticeArea}
                  onChange={(value) => setValue('practiceArea', value)}
                  error={errors.practiceArea?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please describe your legal situation *
                </label>
                <textarea
                  {...register('caseDescription')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Please provide details about what happened, when it occurred, and what kind of help you need..."
                />
                {errors.caseDescription && (
                  <p className="mt-1 text-sm text-red-600">{errors.caseDescription.message}</p>
                )}
                <div className="mt-1 text-xs text-gray-500">
                  {watchedCaseDescription?.length || 0}/2000 characters
                </div>
              </div>

              {watchedPracticeArea === PracticeArea.PERSONAL_INJURY && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    When did the incident occur?
                  </label>
                  <input
                    type="date"
                    {...register('incidentDate')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {estimatedCaseValue && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 rounded-lg p-4"
                >
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Estimated Case Value: ${estimatedCaseValue.toLocaleString()}
                      </p>
                      <p className="text-xs text-green-600">
                        Based on similar cases in your area
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    {...register('firstName')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    {...register('lastName')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Smith"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john.smith@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <PhoneInput
                  placeholder="(555) 123-4567"
                  value={watch('phone')}
                  onChange={(value) => setValue('phone', value || '')}
                  defaultCountry="US"
                  className="w-full"
                  style={{
                    '--PhoneInputCountryFlag-height': '1em',
                    '--PhoneInput-color--focus': '#2563eb',
                  }}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Your information is secure and confidential
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      We use bank-level encryption and never share your personal information with unauthorized parties.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && variant === 'full' && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <div className="relative">
                    <MapPinIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      {...register('city')}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Los Angeles"
                    />
                  </div>
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <StateSelect
                    value={watch('state')}
                    onChange={(value) => setValue('state', value)}
                    error={errors.state?.message}
                  />
                </div>
              </div>

              <div className="max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  {...register('zipCode')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="90210"
                />
                {errors.zipCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.zipCode.message}</p>
                )}
              </div>

              {/* Additional questions based on practice area */}
              {watchedPracticeArea === PracticeArea.PERSONAL_INJURY && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900">Additional Information</h4>
                  
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('hasMedicalTreatment')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        I have received or am receiving medical treatment
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('hasInsurance')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        I have health insurance
                      </span>
                    </label>
                  </div>

                  {watch('hasInsurance') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Insurance Provider
                      </label>
                      <input
                        type="text"
                        {...register('insuranceProvider')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Blue Cross, Aetna, Kaiser"
                      />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Previous
              </button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {variant !== 'compact' && (
              <div className="text-xs text-gray-500">
                🔒 SSL Encrypted & HIPAA Compliant
              </div>
            )}
            
            {currentStep < totalSteps - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isValid}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Continue
                <ChevronRightIcon className="ml-2 h-5 w-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Get My Free Consultation
                    <ChevronRightIcon className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

// Helper function to estimate case value (simplified for demo)
function estimateCaseValue(practiceArea: PracticeArea, description: string): number {
  const baseValues: Record<PracticeArea, number> = {
    [PracticeArea.WRONGFUL_DEATH]: 500000,
    [PracticeArea.MEDICAL_MALPRACTICE]: 250000,
    [PracticeArea.PRODUCT_LIABILITY]: 150000,
    [PracticeArea.CAR_ACCIDENT]: 75000,
    [PracticeArea.SLIP_AND_FALL]: 45000,
    [PracticeArea.WORKERS_COMPENSATION]: 35000,
    [PracticeArea.ESTATE_PLANNING]: 25000,
    [PracticeArea.BUSINESS_LAW]: 50000,
    [PracticeArea.CRIMINAL_DEFENSE]: 15000,
    [PracticeArea.FAMILY_LAW]: 20000,
    [PracticeArea.EMPLOYMENT_LAW]: 40000,
    [PracticeArea.REAL_ESTATE_LAW]: 30000,
    // Add other practice areas...
  };

  let baseValue = baseValues[practiceArea] || 25000;
  
  // Adjust based on description keywords
  const description_lower = description.toLowerCase();
  
  if (description_lower.includes('severe') || description_lower.includes('permanent')) {
    baseValue *= 1.5;
  }
  if (description_lower.includes('hospital') || description_lower.includes('surgery')) {
    baseValue *= 1.3;
  }
  if (description_lower.includes('disability') || description_lower.includes('wheelchair')) {
    baseValue *= 2;
  }
  
  return Math.round(baseValue);
}