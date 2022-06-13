import {
    _decorator,
    Animation,
    AudioSource,
    Collider2D,
    Component,
    Contact2DType,
    instantiate,
    Node,
    NodePool,
    Prefab
} from 'cc';
import {gameObserver, main, observers, size, states, mute} from 'db://assets/Scripts/main';

const {ccclass, property} = _decorator;

@ccclass('PlayerControl')
export class PlayerControl extends Component implements gameObserver {
    // // 创建单例
    // private static instance: PlayerControl;
    // // 构造函数私有化，让外部不能new对象
    // private constructor() {
    //     super();
    // }
    //
    // static Instance(){
    //     // 判断当前单例是否产生
    //     if(!PlayerControl.instance){
    //         PlayerControl.instance = new PlayerControl();
    //     }
    //     return PlayerControl.instance;
    // }

    // 创建公共静态对象
    public static instance: PlayerControl = null;
    @property(Prefab)
    bullet1Pre: Prefab = null;
    @property(Prefab)
    bullet2Pre: Prefab = null;
    // 创建子弹对象池
    bullet1Pool: NodePool = null;
    bullet2Pool: NodePool = null;

    // 当前子弹类型
    bulletTag: number = 1;
    // 当前时间
    nowTime: number = Date.now();

    sound: AudioSource;

    start() {
        // 加入到监听者数组，订阅游戏状态变化的消息
        observers.push(this);
        // 静态对象赋值为当前对象
        PlayerControl.instance = this;
        // 初始化子弹对象池
        this.bullet1Pool = new NodePool('bullet1Pre');
        this.bullet2Pool = new NodePool('bullet2Pre');
        // 获取任意类型的碰撞器实例，可以使用基类
        const collider = this.node.getComponent(Collider2D);
        // 注册单个碰撞体的回调函数
        collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        // 获取 AudioSource 组件
        this.sound = this.node.getComponent(AudioSource);
    }

    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D) {
        if (otherCollider.tag == 8) {
            this.bulletTag = 8;
            this.unschedule(this.shootBullet1);
            this.schedule(this.shootBullet2, 0.1);
            return;
        }
        if (otherCollider.tag == 7) {
            // 清除屏幕上的敌机
            main.instance.setstate(states.cls)
            this.scheduleOnce(()=>{
                main.instance.setstate(states.playing)
            }, 0);
            return;
        }
        if (otherCollider.tag == 6) {
            // 添加一颗炸弹，上限为3颗
            main.instance.eatBomb();
            return;
        }
        // 碰撞后限流1s防止连续判定
        if(Date.now() - this.nowTime < 1000) return;
        this.nowTime = Date.now();
        if (this.bulletTag == 8) {
            // 如果此时的子弹为子弹2，碰撞到敌人就阶级子弹而不判定死亡
            if(mute) this.sound.play();
            this.bulletTag = 1;
            this.unschedule(this.shootBullet2);
            this.schedule(this.shootBullet1, 0.1);
            return;
        }
        // 播放音效
        if(mute) this.sound.play();
        // 替换为被子弹击中爆炸的动画
        this.node.getComponent(Animation).play('hero_die');
        this.onPause();
        this.bulletTag = 1;
        this.unscheduleAllCallbacks();
        main.instance.over();
    }

    // 监听游戏状态的变化
    state(state: states) {
        switch (state) {
            case states.ready:
                this.node.getComponent(Animation).play('hero_normal');
            case states.over:
                this.over();
                break;
            case states.playing:
                this.onStart();
                break;
            case states.pause:
                this.onPause();
                break;
        }
    }

    update(deltaTime: number) {
    }

    onStart() {
        this.node.getComponent(Animation).play('hero_normal');
        // 恢复接收输入事件
        this.node.resumeSystemEvents(true);
        // 计算设备像素和项目像素的比值（这里项目设置的是适配屏幕宽，所以计算x轴的比值）
        let x: number = 640 / size.x;
        let y: number = size.y * x / 2;
        // 移动
        this.node.on(Node.EventType.TOUCH_MOVE, (e) => {
            this.node.setPosition(e.getLocationX() * x - 320, e.getLocationY() * x - y, 0);
        }, this);
        // 攻击 计时器
        if (this.bulletTag === 1) {
            this.schedule(this.shootBullet1, 0.1);
        } else if (this.bulletTag === 8) {
            this.schedule(this.shootBullet2, 0.1);
        }
    }

    onPause() {
        // 暂停接收输入事件
        this.node.pauseSystemEvents(true);
        // 关闭发射子弹的定时器
        this.unscheduleAllCallbacks();
    }

    over() {
        this.onPause();
        this.bulletTag = 1;
        this.node.setPosition(0, -420, 0);
    }

    // 创建子弹1
    shootBullet1() {
        let bullet: Node;
        if (this.bullet1Pool.size()) {
            bullet = this.bullet1Pool.get();
        } else {
            bullet = instantiate(this.bullet1Pre);
        }
        // 设置父对象
        bullet.setParent(this.node.parent);
        // 设置子弹位置
        bullet.setPosition(this.node.position.x, this.node.position.y + 55, 0);
    }

    // 创建子弹2
    shootBullet2() {
        let bulletLeft: Node;
        let bulletRight: Node;
        if (this.bullet2Pool.size() > 1) {
            bulletLeft = this.bullet2Pool.get();
            bulletRight = this.bullet2Pool.get();
        } else {
            bulletLeft = instantiate(this.bullet2Pre);
            bulletRight = instantiate(this.bullet2Pre);
        }
        // 设置父对象
        bulletLeft.setParent(this.node.parent);
        bulletRight.setParent(this.node.parent);
        // 设置子弹位置
        bulletLeft.setPosition(this.node.position.x - 15, this.node.position.y + 55, 0);
        bulletRight.setPosition(this.node.position.x + 15, this.node.position.y + 55, 0);
    }

    // 回收子弹
    recycleBullet(bullet, bulletType) {
        if (bulletType === 'bullet1') {
            this.bullet1Pool.put(bullet);
        } else if (bulletType === 'bullet2') {
            this.bullet2Pool.put(bullet);
        }
    }
}

