// ============================================================
// Skills Database — Categorized skill dictionary
// ============================================================

export const SKILL_DATABASE = {
    'Programming Languages': [
        'python', 'java', 'javascript', 'typescript', 'c', 'c++', 'c#', 'ruby', 'go',
        'golang', 'rust', 'swift', 'kotlin', 'php', 'perl', 'scala', 'r', 'matlab',
        'objective-c', 'dart', 'lua', 'haskell', 'elixir', 'clojure', 'erlang',
        'fortran', 'assembly', 'vhdl', 'verilog', 'julia', 'groovy', 'coffeescript',
        'visual basic', 'vb.net', 'f#', 'scheme', 'prolog', 'cobol', 'bash', 'shell',
        'powershell', 'sql', 'plsql', 'pl/sql', 'tsql', 't-sql', 'solidity'
    ],

    'Web Frontend': [
        'html', 'html5', 'css', 'css3', 'sass', 'scss', 'less', 'tailwind', 'tailwindcss',
        'bootstrap', 'material ui', 'mui', 'chakra ui', 'ant design', 'bulma',
        'react', 'reactjs', 'react.js', 'angular', 'angularjs', 'vue', 'vuejs', 'vue.js',
        'svelte', 'next.js', 'nextjs', 'nuxt', 'nuxtjs', 'gatsby', 'remix',
        'jquery', 'webpack', 'vite', 'rollup', 'parcel', 'babel', 'eslint', 'prettier',
        'storybook', 'cypress', 'playwright', 'selenium', 'puppeteer',
        'redux', 'zustand', 'mobx', 'recoil', 'context api', 'rxjs',
        'three.js', 'threejs', 'd3', 'd3.js', 'chart.js', 'highcharts', 'echarts',
        'webgl', 'canvas', 'svg', 'gsap', 'framer motion', 'animation',
        'responsive design', 'progressive web app', 'pwa', 'web components',
        'web accessibility', 'a11y', 'wcag', 'seo', 'ssr', 'ssg', 'csr'
    ],

    'Web Backend': [
        'node.js', 'nodejs', 'express', 'expressjs', 'express.js', 'fastify', 'koa',
        'nestjs', 'nest.js', 'hapi', 'django', 'flask', 'fastapi', 'spring',
        'spring boot', 'springboot', 'rails', 'ruby on rails', 'laravel', 'symfony',
        'asp.net', '.net', 'dotnet', '.net core', 'blazor', 'gin', 'fiber', 'echo',
        'actix', 'rocket', 'phoenix', 'graphql', 'rest', 'restful', 'api', 'grpc',
        'websocket', 'socket.io', 'microservices', 'serverless', 'middleware',
        'oauth', 'jwt', 'authentication', 'authorization', 'passport', 'bcrypt'
    ],

    'Databases': [
        'mysql', 'postgresql', 'postgres', 'sqlite', 'mariadb', 'oracle', 'sql server',
        'mssql', 'mongodb', 'mongoose', 'redis', 'memcached', 'elasticsearch',
        'cassandra', 'dynamodb', 'couchdb', 'couchbase', 'neo4j', 'arangodb',
        'firebase', 'firestore', 'supabase', 'prisma', 'sequelize', 'typeorm',
        'knex', 'drizzle', 'hibernate', 'mybatis', 'database', 'nosql', 'orm',
        'data modeling', 'indexing', 'query optimization', 'stored procedures',
        'triggers', 'views', 'normalization', 'denormalization', 'sharding',
        'replication', 'etl', 'data warehouse', 'data lake', 'olap', 'oltp',
        'snowflake', 'bigquery', 'redshift', 'clickhouse', 'influxdb', 'timescaledb'
    ],

    'Cloud & DevOps': [
        'aws', 'amazon web services', 'azure', 'microsoft azure', 'gcp',
        'google cloud', 'google cloud platform', 'heroku', 'vercel', 'netlify',
        'digitalocean', 'linode', 'cloudflare', 'docker', 'kubernetes', 'k8s',
        'containerization', 'helm', 'terraform', 'ansible', 'puppet', 'chef',
        'vagrant', 'packer', 'jenkins', 'gitlab ci', 'github actions', 'circleci',
        'travis ci', 'bamboo', 'argo cd', 'ci/cd', 'continuous integration',
        'continuous deployment', 'continuous delivery', 'devops', 'devsecops',
        'sre', 'site reliability', 'infrastructure as code', 'iac',
        'ec2', 's3', 'lambda', 'ecs', 'eks', 'fargate', 'rds', 'cloudfront',
        'route53', 'vpc', 'iam', 'cloudwatch', 'sqs', 'sns', 'kinesis',
        'api gateway', 'load balancer', 'auto scaling', 'cdn',
        'linux', 'ubuntu', 'centos', 'debian', 'rhel', 'unix', 'windows server',
        'nginx', 'apache', 'caddy', 'traefik', 'haproxy', 'prometheus',
        'grafana', 'datadog', 'new relic', 'splunk', 'elk stack', 'logstash',
        'kibana', 'fluentd', 'jaeger', 'zipkin', 'opentelemetry'
    ],

    'Data Science & ML': [
        'machine learning', 'deep learning', 'artificial intelligence', 'ai', 'ml',
        'neural network', 'natural language processing', 'nlp', 'computer vision',
        'reinforcement learning', 'supervised learning', 'unsupervised learning',
        'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'sklearn', 'xgboost',
        'lightgbm', 'catboost', 'opencv', 'spacy', 'nltk', 'hugging face',
        'transformers', 'bert', 'gpt', 'llm', 'large language model', 'rag',
        'retrieval augmented generation', 'fine-tuning', 'transfer learning',
        'feature engineering', 'dimensionality reduction', 'pca', 'clustering',
        'classification', 'regression', 'random forest', 'decision tree',
        'naive bayes', 'svm', 'support vector machine', 'gradient boosting',
        'ensemble methods', 'cross validation', 'hyperparameter tuning',
        'cnn', 'rnn', 'lstm', 'gru', 'gan', 'autoencoder', 'vae',
        'attention mechanism', 'transformer', 'diffusion model',
        'pandas', 'numpy', 'scipy', 'matplotlib', 'seaborn', 'plotly',
        'jupyter', 'notebook', 'colab', 'anaconda', 'conda',
        'data analysis', 'data visualization', 'data mining', 'statistics',
        'statistical analysis', 'hypothesis testing', 'a/b testing',
        'bayesian', 'probability', 'linear algebra', 'calculus',
        'mlops', 'mlflow', 'kubeflow', 'sagemaker', 'vertex ai',
        'model deployment', 'model monitoring', 'feature store',
        'data pipeline', 'data engineering', 'spark', 'pyspark',
        'hadoop', 'hive', 'pig', 'mapreduce', 'kafka', 'airflow',
        'dbt', 'dagster', 'prefect', 'power bi', 'tableau', 'looker',
        'metabase', 'superset', 'qlik', 'excel', 'google sheets',
        'langchain', 'llamaindex', 'vector database', 'pinecone',
        'weaviate', 'chroma', 'milvus', 'embedding', 'cosine similarity',
        'tf-idf', 'word2vec', 'glove', 'fasttext', 'sentence transformers'
    ],

    'Mobile Development': [
        'android', 'ios', 'react native', 'flutter', 'xamarin', 'ionic',
        'cordova', 'phonegap', 'swift', 'swiftui', 'uikit', 'objective-c',
        'kotlin', 'jetpack compose', 'android studio', 'xcode',
        'expo', 'capacitor', 'nativescript', 'maui', '.net maui',
        'mobile development', 'cross-platform', 'responsive',
        'app store', 'google play', 'push notifications', 'deep linking',
        'mobile ui', 'material design', 'human interface guidelines'
    ],

    'Testing & QA': [
        'unit testing', 'integration testing', 'e2e testing', 'end-to-end testing',
        'test driven development', 'tdd', 'behavior driven development', 'bdd',
        'jest', 'mocha', 'chai', 'jasmine', 'karma', 'vitest', 'ava',
        'pytest', 'unittest', 'robot framework', 'selenium', 'cypress',
        'playwright', 'puppeteer', 'webdriver', 'appium', 'detox',
        'postman', 'insomnia', 'swagger', 'openapi', 'api testing',
        'load testing', 'performance testing', 'stress testing', 'jmeter',
        'k6', 'locust', 'gatling', 'artillery', 'soap ui',
        'code review', 'code coverage', 'istanbul', 'sonarqube',
        'quality assurance', 'qa', 'manual testing', 'automated testing',
        'regression testing', 'smoke testing', 'sanity testing',
        'acceptance testing', 'uat', 'bug tracking', 'jira', 'bugzilla'
    ],

    'Security': [
        'cybersecurity', 'information security', 'infosec', 'network security',
        'application security', 'appsec', 'penetration testing', 'pen testing',
        'vulnerability assessment', 'threat modeling', 'security audit',
        'owasp', 'sast', 'dast', 'iast', 'rasp', 'waf', 'firewall',
        'ids', 'ips', 'intrusion detection', 'intrusion prevention',
        'encryption', 'cryptography', 'ssl', 'tls', 'https', 'ssh',
        'vpn', 'zero trust', 'identity management', 'access control',
        'rbac', 'abac', 'mfa', 'two-factor authentication', '2fa',
        'soc', 'siem', 'incident response', 'forensics', 'malware analysis',
        'phishing', 'social engineering', 'ethical hacking', 'bug bounty',
        'compliance', 'gdpr', 'hipaa', 'pci-dss', 'iso 27001', 'nist',
        'soc 2', 'fedramp', 'data protection', 'data privacy'
    ],

    'Project Management & Tools': [
        'agile', 'scrum', 'kanban', 'waterfall', 'lean', 'safe',
        'sprint planning', 'standup', 'retrospective', 'backlog',
        'user story', 'epic', 'roadmap', 'stakeholder management',
        'jira', 'confluence', 'trello', 'asana', 'monday.com', 'clickup',
        'notion', 'linear', 'shortcut', 'basecamp', 'microsoft project',
        'git', 'github', 'gitlab', 'bitbucket', 'svn', 'mercurial',
        'version control', 'branching strategy', 'gitflow', 'trunk-based',
        'pull request', 'code review', 'pair programming', 'mob programming',
        'figma', 'sketch', 'adobe xd', 'invision', 'zeplin',
        'slack', 'teams', 'microsoft teams', 'zoom', 'google meet',
        'documentation', 'technical writing', 'api documentation',
        'project management', 'product management', 'program management',
        'pmp', 'prince2', 'itil', 'six sigma', 'togaf'
    ],

    'Soft Skills': [
        'leadership', 'team leadership', 'mentoring', 'coaching', 'management',
        'communication', 'written communication', 'verbal communication',
        'presentation', 'public speaking', 'negotiation', 'persuasion',
        'problem solving', 'critical thinking', 'analytical thinking',
        'creative thinking', 'innovation', 'design thinking',
        'teamwork', 'collaboration', 'cross-functional', 'interpersonal',
        'time management', 'organization', 'planning', 'prioritization',
        'adaptability', 'flexibility', 'resilience', 'stress management',
        'decision making', 'conflict resolution', 'emotional intelligence',
        'customer service', 'client relations', 'stakeholder management',
        'attention to detail', 'multitasking', 'self-motivated', 'proactive',
        'results-oriented', 'goal-oriented', 'strategic thinking',
        'research', 'analytical skills', 'data-driven', 'continuous learning'
    ]
};

// Flatten the skill database for quick lookups
export const ALL_SKILLS = {};
Object.entries(SKILL_DATABASE).forEach(([category, skills]) => {
    skills.forEach(skill => {
        ALL_SKILLS[skill] = category;
    });
});

// Skill aliases — maps variations to canonical names
export const SKILL_ALIASES = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'cpp': 'c++',
    'csharp': 'c#',
    'dotnet': '.net',
    'node': 'node.js',
    'express': 'express.js',
    'react': 'reactjs',
    'angular': 'angularjs',
    'vue': 'vuejs',
    'next': 'next.js',
    'nuxt': 'nuxtjs',
    'nest': 'nestjs',
    'spring': 'spring boot',
    'ror': 'ruby on rails',
    'postgres': 'postgresql',
    'mongo': 'mongodb',
    'k8s': 'kubernetes',
    'tf': 'tensorflow',
    'sk-learn': 'scikit-learn',
    'cv': 'computer vision',
    'dl': 'deep learning',
    'ml': 'machine learning',
    'ai': 'artificial intelligence',
    'nlp': 'natural language processing',
    'aws': 'amazon web services',
    'gcp': 'google cloud platform',
    'ci/cd': 'continuous integration',
    'e2e': 'end-to-end testing',
    'tdd': 'test driven development',
    'bdd': 'behavior driven development',
    'qa': 'quality assurance',
    'ux': 'user experience',
    'ui': 'user interface',
    'pm': 'project management'
};
