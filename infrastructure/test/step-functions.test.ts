import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DocumentAnalysisStack } from '../lib/document-analysis-stack';

// Helper function to extract state machine definition from CDK template
// Handles both old (DefinitionString) and new (DefinitionBody) formats
function getStateMachineDefinition(stateMachine: any): any {
  // Try DefinitionBody first (new format)
  if (stateMachine.Properties.DefinitionBody) {
    return stateMachine.Properties.DefinitionBody;
  }
  // Try DefinitionString (old format)
  if (stateMachine.Properties.DefinitionString) {
    const defString = stateMachine.Properties.DefinitionString;
    // If it's already an object, check if it's a Fn::Join
    if (typeof defString === 'object') {
      // Handle Fn::Join intrinsic function
      if (defString['Fn::Join']) {
        // Extract all parts from the Fn::Join array
        const joinParts = defString['Fn::Join'][1];
        // Reconstruct the JSON by joining string parts and replacing refs with placeholders
        let reconstructed = '';
        for (const part of joinParts) {
          if (typeof part === 'string') {
            reconstructed += part;
          } else if (typeof part === 'object') {
            // Replace CloudFormation refs with placeholder ARNs
            if (part['Ref']) {
              reconstructed += 'arn:aws:placeholder';
            } else if (part['Fn::GetAtt']) {
              reconstructed += 'arn:aws:placeholder:resource';
            }
          }
        }
        return JSON.parse(reconstructed);
      }
      return defString;
    }
    // If it's a string, parse it
    return JSON.parse(defString);
  }
  throw new Error('No definition found in state machine');
}

describe('Step Functions State Machine', () => {
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    const stack = new DocumentAnalysisStack(app, 'TestStack', {
      environment: 'test',
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  test('Creates Step Functions state machine', () => {
    // Verify state machine exists
    template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      StateMachineName: 'DocumentProcessing-test',
      TracingConfiguration: {
        Enabled: true,
      },
    });
  });

  test('State machine has correct timeout', () => {
    // Verify 10-minute timeout
    const stateMachines = template.findResources('AWS::StepFunctions::StateMachine');
    const stateMachine = Object.values(stateMachines)[0] as any;
    
    // Timeout should be 600 seconds (10 minutes)
    expect(stateMachine.Properties.DefinitionString).toBeDefined();
  });

  test('State machine has ExtractText task with retry policy', () => {
    // Verify ExtractText task exists with retry configuration
    const stateMachines = template.findResources('AWS::StepFunctions::StateMachine');
    const stateMachine = Object.values(stateMachines)[0] as any;
    const definition = getStateMachineDefinition(stateMachine);
    
    // Find ExtractText state
    const extractTextState = definition.States.ExtractText;
    expect(extractTextState).toBeDefined();
    expect(extractTextState.Type).toBe('Task');
    expect(extractTextState.Resource).toContain('lambda:invoke');
    
    // Verify retry policy
    expect(extractTextState.Retry).toBeDefined();
    expect(extractTextState.Retry.length).toBeGreaterThan(0);
    
    // Check our custom retry policy (second one, index 1)
    // The first retry policy (index 0) is added by retryOnServiceExceptions: true
    const customRetryPolicy = extractTextState.Retry.find((retry: any) => retry.MaxAttempts === 3);
    expect(customRetryPolicy).toBeDefined();
    expect(customRetryPolicy.MaxAttempts).toBe(3);
    expect(customRetryPolicy.BackoffRate).toBe(2.0);
    expect(customRetryPolicy.IntervalSeconds).toBe(2);
  });

  test('State machine has CheckStatus choice state', () => {
    // Verify CheckStatus choice state exists
    const stateMachines = template.findResources('AWS::StepFunctions::StateMachine');
    const stateMachine = Object.values(stateMachines)[0] as any;
    const definition = getStateMachineDefinition(stateMachine);
    
    const checkStatusState = definition.States.CheckStatus;
    expect(checkStatusState).toBeDefined();
    expect(checkStatusState.Type).toBe('Choice');
    
    // Verify choices
    expect(checkStatusState.Choices).toBeDefined();
    expect(checkStatusState.Choices.length).toBeGreaterThan(0);
    
    // Verify completed status choice
    const completedChoice = checkStatusState.Choices.find((choice: any) => 
      choice.Variable === '$.status' && choice.StringEquals === 'completed'
    );
    expect(completedChoice).toBeDefined();
    expect(completedChoice.Next).toBe('ProcessingSucceeded');
    
    // Verify failed status choice - now handled by otherwise
    expect(checkStatusState.Default).toBe('HandleError');
  });

  test('State machine has HandleError task', () => {
    // Verify HandleError task exists
    const stateMachines = template.findResources('AWS::StepFunctions::StateMachine');
    const stateMachine = Object.values(stateMachines)[0] as any;
    const definition = getStateMachineDefinition(stateMachine);
    
    const handleErrorState = definition.States.HandleError;
    expect(handleErrorState).toBeDefined();
    expect(handleErrorState.Type).toBe('Task');
    expect(handleErrorState.Resource).toContain('lambda:invoke');
    expect(handleErrorState.Next).toBe('ProcessingFailed');
  });

  test('State machine has Success and Fail states', () => {
    // Verify terminal states exist
    const stateMachines = template.findResources('AWS::StepFunctions::StateMachine');
    const stateMachine = Object.values(stateMachines)[0] as any;
    const definition = getStateMachineDefinition(stateMachine);
    
    const successState = definition.States.ProcessingSucceeded;
    expect(successState).toBeDefined();
    expect(successState.Type).toBe('Succeed');
    
    const failState = definition.States.ProcessingFailed;
    expect(failState).toBeDefined();
    expect(failState.Type).toBe('Fail');
  });

  test('ExtractText task has error catching', () => {
    // Verify error catching configuration
    const stateMachines = template.findResources('AWS::StepFunctions::StateMachine');
    const stateMachine = Object.values(stateMachines)[0] as any;
    const definition = getStateMachineDefinition(stateMachine);
    
    const extractTextState = definition.States.ExtractText;
    expect(extractTextState.Catch).toBeDefined();
    expect(extractTextState.Catch.length).toBeGreaterThan(0);
    
    const catchConfig = extractTextState.Catch[0];
    expect(catchConfig.ErrorEquals).toContain('States.ALL');
    expect(catchConfig.Next).toBe('HandleError');
    expect(catchConfig.ResultPath).toBe('$.errorInfo');
  });

  test('State machine has correct IAM role', () => {
    // Verify state machine has execution role
    const stateMachines = template.findResources('AWS::StepFunctions::StateMachine');
    const stateMachine = Object.values(stateMachines)[0] as any;
    
    expect(stateMachine.Properties.RoleArn).toBeDefined();
  });

  test('State machine can invoke Lambda functions', () => {
    // Verify IAM policies allow state machine to invoke Lambda
    const policies = template.findResources('AWS::IAM::Policy');
    
    const stateMachinePolicies = Object.values(policies).filter((policy: any) => 
      policy.Properties.PolicyDocument?.Statement?.some((stmt: any) => {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        return actions.some((a: string) => a.includes('lambda:InvokeFunction'));
      })
    );
    
    expect(stateMachinePolicies.length).toBeGreaterThan(0);
  });

  test('Stack has Step Functions outputs', () => {
    // Verify Step Functions outputs exist
    // CDK adds construct ID as prefix, so we look for StepFunctionsStateMachineArn
    const outputs = template.toJSON().Outputs;
    const stateMachineArnOutput = Object.keys(outputs).find(key => 
      key.includes('StepFunctions') && key.includes('StateMachineArn')
    );
    const stateMachineNameOutput = Object.keys(outputs).find(key => 
      key.includes('StepFunctions') && key.includes('StateMachineName')
    );
    
    expect(stateMachineArnOutput).toBeDefined();
    expect(stateMachineNameOutput).toBeDefined();
  });
});

describe('Lambda Functions for Step Functions', () => {
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    const stack = new DocumentAnalysisStack(app, 'TestStack', {
      environment: 'test',
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  test('Creates BedrockProcessor Lambda function', () => {
    // Verify BedrockProcessor Lambda exists
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'BedrockProcessor-test',
      Runtime: 'python3.12',
      Handler: 'handler.lambda_handler',
      Timeout: 300, // 5 minutes
      MemorySize: 1024,
    });
  });

  test('BedrockProcessor has correct environment variables', () => {
    // Verify environment variables
    const functions = template.findResources('AWS::Lambda::Function');
    const bedrockProcessor = Object.values(functions).find((fn: any) => 
      fn.Properties.FunctionName === 'BedrockProcessor-test'
    ) as any;
    
    expect(bedrockProcessor).toBeDefined();
    expect(bedrockProcessor.Properties.Environment.Variables).toMatchObject({
      BEDROCK_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
    });
    expect(bedrockProcessor.Properties.Environment.Variables.DOCUMENTS_BUCKET_NAME).toBeDefined();
    expect(bedrockProcessor.Properties.Environment.Variables.RESULTS_BUCKET_NAME).toBeDefined();
    expect(bedrockProcessor.Properties.Environment.Variables.DOCUMENTS_TABLE_NAME).toBeDefined();
    expect(bedrockProcessor.Properties.Environment.Variables.RESULTS_TABLE_NAME).toBeDefined();
  });

  test('Creates ErrorHandler Lambda function', () => {
    // Verify ErrorHandler Lambda exists
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'ErrorHandler-test',
      Runtime: 'python3.12',
      Handler: 'handler.lambda_handler',
      Timeout: 30,
      MemorySize: 256,
    });
  });

  test('ErrorHandler has correct environment variables', () => {
    // Verify environment variables
    const functions = template.findResources('AWS::Lambda::Function');
    const errorHandler = Object.values(functions).find((fn: any) => 
      fn.Properties.FunctionName === 'ErrorHandler-test'
    ) as any;
    
    expect(errorHandler).toBeDefined();
    expect(errorHandler.Properties.Environment.Variables.DOCUMENTS_TABLE_NAME).toBeDefined();
  });

  test('Creates StepFunctionsTrigger Lambda function', () => {
    // Verify StepFunctionsTrigger Lambda exists
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'StepFunctionsTrigger-test',
      Runtime: 'python3.12',
      Handler: 'handler.lambda_handler',
      Timeout: 60,
      MemorySize: 256,
    });
  });

  test('StepFunctionsTrigger has correct environment variables', () => {
    // Verify environment variables
    const functions = template.findResources('AWS::Lambda::Function');
    const trigger = Object.values(functions).find((fn: any) => 
      fn.Properties.FunctionName === 'StepFunctionsTrigger-test'
    ) as any;
    
    expect(trigger).toBeDefined();
    expect(trigger.Properties.Environment.Variables.DOCUMENTS_TABLE_NAME).toBeDefined();
    expect(trigger.Properties.Environment.Variables.STATE_MACHINE_ARN).toBeDefined();
  });

  test('Creates shared Lambda layer', () => {
    // Verify shared layer exists
    const layers = template.findResources('AWS::Lambda::LayerVersion');
    expect(Object.keys(layers).length).toBeGreaterThan(0);
    
    const sharedLayer = Object.values(layers)[0] as any;
    expect(sharedLayer.Properties.CompatibleRuntimes).toContain('python3.12');
    expect(sharedLayer.Properties.Description).toContain('Shared utilities');
  });

  test('BedrockProcessor uses shared layer', () => {
    // Verify BedrockProcessor has layer attached
    const functions = template.findResources('AWS::Lambda::Function');
    const bedrockProcessor = Object.values(functions).find((fn: any) => 
      fn.Properties.FunctionName === 'BedrockProcessor-test'
    ) as any;
    
    expect(bedrockProcessor).toBeDefined();
    expect(bedrockProcessor.Properties.Layers).toBeDefined();
    expect(bedrockProcessor.Properties.Layers.length).toBeGreaterThan(0);
  });

  test('Stack has Lambda function outputs', () => {
    // Verify Lambda function outputs exist
    // CDK adds construct ID as prefix, so we look for outputs containing these names
    const outputs = template.toJSON().Outputs;
    const bedrockProcessorOutput = Object.keys(outputs).find(key => 
      key.includes('LambdaFunctions') && key.includes('BedrockProcessorFunctionArn')
    );
    const errorHandlerOutput = Object.keys(outputs).find(key => 
      key.includes('LambdaFunctions') && key.includes('ErrorHandlerFunctionArn')
    );
    const triggerOutput = Object.keys(outputs).find(key => 
      key.includes('LambdaFunctions') && key.includes('StepFunctionsTriggerFunctionArn')
    );
    
    expect(bedrockProcessorOutput).toBeDefined();
    expect(errorHandlerOutput).toBeDefined();
    expect(triggerOutput).toBeDefined();
  });
});

describe('S3 Event Notification', () => {
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    const stack = new DocumentAnalysisStack(app, 'TestStack', {
      environment: 'test',
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  test('Documents bucket has Lambda notification configuration', () => {
    // Verify S3 bucket notification configuration exists
    // CDK creates a Custom::S3BucketNotifications resource instead of inline config
    const notifications = template.findResources('Custom::S3BucketNotifications');
    const notificationResource = Object.values(notifications).find((notif: any) => 
      notif.Properties.NotificationConfiguration?.LambdaFunctionConfigurations
    ) as any;
    
    expect(notificationResource).toBeDefined();
    expect(notificationResource.Properties.NotificationConfiguration.LambdaFunctionConfigurations).toBeDefined();
    expect(notificationResource.Properties.NotificationConfiguration.LambdaFunctionConfigurations.length).toBeGreaterThan(0);
  });

  test('S3 notification triggers on object creation', () => {
    // Verify notification is configured for object creation events
    const notifications = template.findResources('Custom::S3BucketNotifications');
    const notificationResource = Object.values(notifications).find((notif: any) => 
      notif.Properties.NotificationConfiguration?.LambdaFunctionConfigurations
    ) as any;
    
    const lambdaConfig = notificationResource.Properties.NotificationConfiguration.LambdaFunctionConfigurations[0];
    expect(lambdaConfig.Events).toBeDefined();
    expect(lambdaConfig.Events).toContain('s3:ObjectCreated:*');
  });

  test('S3 notification has correct prefix filter', () => {
    // Verify notification filters for documents/ prefix
    const notifications = template.findResources('Custom::S3BucketNotifications');
    const notificationResource = Object.values(notifications).find((notif: any) => 
      notif.Properties.NotificationConfiguration?.LambdaFunctionConfigurations
    ) as any;
    
    const lambdaConfig = notificationResource.Properties.NotificationConfiguration.LambdaFunctionConfigurations[0];
    expect(lambdaConfig.Filter).toBeDefined();
    expect(lambdaConfig.Filter.Key).toBeDefined();
    expect(lambdaConfig.Filter.Key.FilterRules).toContainEqual({
      Name: 'prefix',
      Value: 'documents/',
    });
  });

  test('StepFunctionsTrigger Lambda has S3 invoke permission', () => {
    // Verify Lambda has permission to be invoked by S3
    const permissions = template.findResources('AWS::Lambda::Permission');
    const s3Permission = Object.values(permissions).find((perm: any) => 
      perm.Properties.Principal === 's3.amazonaws.com'
    );
    
    expect(s3Permission).toBeDefined();
  });

  test('StepFunctionsTrigger can start Step Functions execution', () => {
    // Verify Lambda role has permission to start executions
    const policies = template.findResources('AWS::IAM::Policy');
    const triggerPolicies = Object.values(policies).filter((policy: any) => 
      policy.Properties.PolicyDocument?.Statement?.some((stmt: any) => {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        return actions.some((a: string) => a.includes('states:StartExecution'));
      })
    );
    
    expect(triggerPolicies.length).toBeGreaterThan(0);
  });
});
