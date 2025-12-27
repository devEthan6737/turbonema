const config = {
    PRO: {
        prefix: '..',
        emojis: {}
    },
    PRU: {
        prefix: '..',
        emojis: {}
    },
    DES: {
        prefix: '..',
        emojis: {}
    }
} as const;

type EnviromentType = keyof typeof config;
const enviroment = process.env.ENVIROMENT ?? '';

if (![ 'DES', 'PRU', 'PRO' ].includes(enviroment)) throw new Error(enviroment + ' is not an allowed EnviromentType');

type ConfigInstanceType = typeof config['PRO'] | typeof config['PRU'] | typeof config['DES'];
const ConfigInstance: ConfigInstanceType = config[enviroment as EnviromentType];

export default ConfigInstance;