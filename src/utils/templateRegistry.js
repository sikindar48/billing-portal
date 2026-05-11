import { lazy } from 'react';

const Template1 = lazy(() => import('../components/templates/Template1'));
const Template2 = lazy(() => import('../components/templates/Template2'));
const Template3 = lazy(() => import('../components/templates/Template3'));
const Template4 = lazy(() => import('../components/templates/Template4'));
const Template5 = lazy(() => import('../components/templates/Template5'));
const Template6 = lazy(() => import('../components/templates/Template6'));
const Template7 = lazy(() => import('../components/templates/Template7'));
const Template8 = lazy(() => import('../components/templates/Template8'));
const Template9 = lazy(() => import('../components/templates/Template9'));
const Template10 = lazy(() => import('../components/templates/Template10'));

export const templates = [
  { name: 'Template 1', component: Template1 },
  { name: 'Template 2', component: Template2 },
  { name: 'Template 3', component: Template3 },
  { name: 'Template 4', component: Template4 },
  { name: 'Template 5', component: Template5 },
  { name: 'Template 6', component: Template6 },
  { name: 'Template 7', component: Template7 },
  { name: 'Template 8', component: Template8 },
  { name: 'Template 9', component: Template9 },
  { name: 'Template 10', component: Template10 },
];

export const getTemplate = (templateNumber) => {
  return templates[templateNumber - 1]?.component || templates[0].component; // Default to Template1 if not found
};
