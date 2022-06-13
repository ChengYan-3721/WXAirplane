import {_decorator, Component, Collider2D, Contact2DType, Animation, RigidBody2D, Vec2, AudioSource, AudioClip} from 'cc';
import {size, state, states, main, mute} from 'db://assets/Scripts/main';
import {EnemyManager} from "db://assets/Scripts/EnemyManager";

const {ccclass, property} = _decorator;

@ccclass('Enemy')
export class Enemy extends Component {
    // 敌机类型名称
    @property(String)
    enemyType: string;
    // 血量
    @property(Number)
    blood: number;
    // 正常状态动画名称
    @property(String)
    normal_anim: string;
    // 被击毁动画名称
    @property(String)
    die_anim: string;
    // 被击毁动画名称
    @property(Number)
    animTime: number;
    // 音效
    @property(AudioClip)
    audioClip: AudioClip;
    // 播放声音的组件
    sound: AudioSource;
    // 当前血量
    realBlood: number;
    // 拿到当前的线速度，唤醒的时候有用
    speed: Vec2;
    // 保存当前的游戏状态
    myState: states = state;

    start() {
        // 获取任意类型的碰撞器实例，可以使用基类
        const collider = this.node.getComponent(Collider2D);
        // 注册单个碰撞体的回调函数
        collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        // 保存当前的速度向量值
        this.speed = this.node.getComponent(RigidBody2D).linearVelocity;
        // 初始化血量
        this.realBlood = this.blood;
        // 获取 AudioSource 组件
        this.sound = main.instance.getComponent(AudioSource);
    }

    // 只在两个碰撞体开始接触时被调用一次
    onBeginContact(selfCollider: Collider2D) {
        if(!--this.realBlood){
            this.die(selfCollider);
        }
    }

    die(selfCollider: Collider2D = null){
        // 播放音效
        if(mute) this.sound.playOneShot(this.audioClip, 1);
        // 碰撞后刚体属性改为false
        if(selfCollider) selfCollider.enabled = false;
        // 减速移动
        this.node.getComponent(RigidBody2D).linearVelocity = this.speed.set(0, -2);
        // 替换为被子弹击中爆炸的动画
        this.node.getComponent(Animation).play(this.die_anim);
        // 延迟回收并初始化节点（等待死亡动画播放完毕）
        this.scheduleOnce(() => {
            EnemyManager.instance.recycleEnemy(this.node, this.enemyType);
            // 加分
            main.instance.score += this.blood;
            // 血量初始化
            this.realBlood = this.blood;
            // 动画初始化
            this.node.getComponent(Animation).play(this.normal_anim);
            // 刚体属性开启
            if(selfCollider) selfCollider.enabled = true;
        }, this.animTime)
    }

    update(deltaTime: number) {
        if (this.myState !== state) {
            switch (state){
                case states.cls:
                    if(this.enemyType !== 'ufo') this.die();
                    break;
                case states.over:
                    EnemyManager.instance.recycleEnemy(this.node, this.enemyType);
                    break;
                case states.playing:
                    this.node.getComponent(RigidBody2D).linearVelocity = this.speed;
                    break;
                case states.pause:
                    this.node.getComponent(RigidBody2D).sleep();
                    break;
            }
            this.myState = state;
        }
        // 出屏幕回收至对象池
        if (this.node.position.y < -size.y * (640 / size.x) / 2 - 150) {
            EnemyManager.instance.recycleEnemy(this.node, this.enemyType);
        }
        // 如果是ufo还要左右摇摆
        if(this.myState === states.playing && this.enemyType === 'ufo'){
            if(this.node.position.x < -200){
                this.node.getComponent(RigidBody2D).linearVelocity = this.speed.set(5, -10);
            }else if(this.node.position.x > 200){
                this.node.getComponent(RigidBody2D).linearVelocity = this.speed.set(-5, -10);
            }
        }
    }
}

