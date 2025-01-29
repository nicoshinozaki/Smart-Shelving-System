import React from 'react';
import { AddonPanel } from 'storybook/internal/components';
import { ADDON_ID, PANEL_ID, PARAM_KEY, SNIPPET_RENDERED } from 'storybook/internal/docs-tools';
import { addons, types, useAddonState, useChannel } from 'storybook/internal/manager-api';
import { Source } from '@storybook/blocks';

addons.register(ADDON_ID,api=>{addons.add(PANEL_ID,{title:"Code",type:types.PANEL,paramKey:PARAM_KEY,disabled:parameters=>!parameters?.docs?.codePanel,match:({viewMode})=>viewMode==="story",render:({active})=>{let[codeSnippet,setSourceCode]=useAddonState(ADDON_ID,{source:"",format:"html"});return useChannel({[SNIPPET_RENDERED]:({source,format})=>{setSourceCode({source,format});}}),React.createElement(AddonPanel,{active:!!active},React.createElement(Source,{code:codeSnippet.source,format:codeSnippet.format,dark:!0}))}});});
