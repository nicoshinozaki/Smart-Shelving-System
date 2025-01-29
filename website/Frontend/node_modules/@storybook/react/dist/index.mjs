import { entry_preview_exports, renderToCanvas } from './chunk-MHYVTTFG.mjs';
import './chunk-XP5HYGXS.mjs';
import { global } from '@storybook/global';
import * as React from 'react';
import { setDefaultProjectAnnotations, setProjectAnnotations as setProjectAnnotations$1, composeStory as composeStory$1, composeStories as composeStories$1 } from 'storybook/internal/preview-api';

var{window:globalWindow}=global;globalWindow&&(globalWindow.STORYBOOK_ENV="react");function setProjectAnnotations(projectAnnotations){return setDefaultProjectAnnotations(INTERNAL_DEFAULT_PROJECT_ANNOTATIONS),setProjectAnnotations$1(projectAnnotations)}var INTERNAL_DEFAULT_PROJECT_ANNOTATIONS={...entry_preview_exports,renderToCanvas:async(renderContext,canvasElement)=>{if(renderContext.storyContext.testingLibraryRender==null){renderContext.storyContext.parameters.__isPortableStory=!0;let unmount2=await renderToCanvas(renderContext,canvasElement);return async()=>{await unmount2();}}let{storyContext:{context,unboundStoryFn:Story,testingLibraryRender:render}}=renderContext,{unmount}=render(React.createElement(Story,{...context}),{container:context.canvasElement});return unmount}};function composeStory(story,componentAnnotations,projectAnnotations,exportsName){return composeStory$1(story,componentAnnotations,projectAnnotations,INTERNAL_DEFAULT_PROJECT_ANNOTATIONS,exportsName)}function composeStories(csfExports,projectAnnotations){return composeStories$1(csfExports,projectAnnotations,composeStory)}typeof module<"u"&&module?.hot?.decline();

export { INTERNAL_DEFAULT_PROJECT_ANNOTATIONS, composeStories, composeStory, setProjectAnnotations };
