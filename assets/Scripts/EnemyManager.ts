import {_decorator, Component, Node, instantiate, Prefab, NodePool, RigidBody2D, Vec2} from 'cc';
import {gameObserver, observers, state, states} from 'db://assets/Scripts/main';

const {ccclass, property} = _decorator;

@ccclass('EnemyManager')
export class EnemyManager extends Component implements gameObserver {
    // 创建公共静态对象
    public static instance: EnemyManager = null;

    @property(Prefab)
    enemy1Pre: Prefab = null;
    // 创建敌机对象池
    enemy1Pool: NodePool = null;
    // 创建二维向量速度对象
    enemySpeed: Vec2 = new Vec2;

    @property(Prefab)
    enemy2Pre: Prefab = null;
    enemy2Pool: NodePool = null;

    @property(Prefab)
    enemy3Pre: Prefab = null;
    enemy3Pool: NodePool = null;

    @property(Prefab)
    ufo1Pre: Prefab = null;
    @property(Prefab)
    ufo2Pre: Prefab = null;
    @property(Prefab)
    bombPre: Prefab = null;

    start() {
        // 加入到监听者数组，订阅游戏状态变化的消息
        observers.push(this);
        // 静态对象赋值为当前对象
        EnemyManager.instance = this;
        // 初始化敌机对象池
        this.enemy1Pool = new NodePool('enemy1Pre');
        this.enemy2Pool = new NodePool('enemy2Pre');
        this.enemy3Pool = new NodePool('enemy3Pre');
    }

    // 监听游戏状态的变化
    state(state: states) {
        switch (state) {
            case states.playing:
                this.onStart();
                break;
            case states.over:
            case states.pause:
                this.onPause();
                break;
        }
    }

    onStart() {
        // 定时器任务生成敌机
        this.schedule(this.randEnemy1, 1);
        this.schedule(this.productionEnemy2, 1.5);
        this.schedule(this.productionEnemy3, 4);
        this.schedule(this.ariseUFO, 20);
    }

    onPause() {
        // 停止生成敌机
        this.unscheduleAllCallbacks();
    }

    update(deltaTime: number) {
    }

    // 创建小敌机
    productionEnemy1() {
        let enemy1: Node;
        if (this.enemy1Pool.size()) {
            enemy1 = this.enemy1Pool.get();
        } else {
            enemy1 = instantiate(this.enemy1Pre);
        }
        enemy1.setParent(this.node.parent);
        enemy1.setPosition(Math.random() * 600 - 300, this.node.position.y, 0);
        // 随机的速度向量
        enemy1.getComponent(RigidBody2D).linearVelocity = this.enemySpeed.set(0, -(Math.floor(Math.random() * 13) + 10));
    }

    // 一次性随机创建 1-6 个小敌机
    randEnemy1() {
        let n: number = Math.floor(Math.random() * 6) + 1;
        for (let i = 0; i < n; i++) {
            this.productionEnemy1();
        }
    }

    // 创建中敌机
    productionEnemy2() {
        let enemy2: Node;
        if (this.enemy2Pool.size()) {
            enemy2 = this.enemy2Pool.get();
        } else {
            enemy2 = instantiate(this.enemy2Pre);
        }
        enemy2.setParent(this.node.parent);
        enemy2.setPosition(Math.random() * 600 - 300, this.node.position.y, 0);
        // 随机的速度向量
        enemy2.getComponent(RigidBody2D).linearVelocity = this.enemySpeed.set(0, -(Math.floor(Math.random() * 7) + 8));
    }

    // 创建大敌机
    productionEnemy3() {
        let enemy3: Node;
        if (this.enemy3Pool.size()) {
            enemy3 = this.enemy3Pool.get();
        } else {
            enemy3 = instantiate(this.enemy3Pre);
        }
        enemy3.setParent(this.node.parent);
        enemy3.setPosition(Math.random() * 600 - 300, this.node.position.y + 150, 0);
        // 随机的速度向量
        enemy3.getComponent(RigidBody2D).linearVelocity = this.enemySpeed.set(0, -(Math.floor(Math.random() * 3) + 5));
    }

    // 回收敌机
    recycleEnemy(enemy: Node, enemyType: string) {
        if(enemyType === 'enemy1'){
            this.enemy1Pool.put(enemy);
        }else if(enemyType === 'enemy2'){
            this.enemy2Pool.put(enemy);
        }else if(enemyType === 'enemy3') {
            this.enemy3Pool.put(enemy);
        }else {
            enemy.destroy();
        }
    }

    ariseUFO() {
        let ufo:Node;
        let rnd: number = Math.floor(Math.random() * 3)
        switch (rnd){
            case 0:
                ufo = instantiate(this.ufo1Pre);
                break;
            case 1:
                ufo = instantiate(this.ufo2Pre);
                break;
            case 2:
                ufo = instantiate(this.bombPre);
                break;
        }
        ufo.setParent(this.node.parent);
        ufo.setPosition(Math.random() * 600 - 300, this.node.position.y, 0);
    }
}

