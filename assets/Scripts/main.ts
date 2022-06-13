import {_decorator, Component, Node, view, math, Label, AudioSource, sys} from 'cc';

const {ccclass, property} = _decorator;
// 返回设备独立像素
export const size: math.Size = view.getVisibleSizeInPixel();

// 定义游戏的三种状态：枚举
export const enum states {over, ready, playing, pause, cls};

// 定义监听游戏状态变化的接口
export interface gameObserver {
    state(value: states);
}

// 所有的观察者
export let observers: Array<gameObserver> = new Array<gameObserver>();
// 游戏状态
export let state: states = states.ready;
// 是否开启声音
export let mute: boolean = true;

@ccclass('main')
export class main extends Component {
    @property(Node)
    bj: Node = null;
    @property(Node)
    status_ready: Node = null;
    @property(Node)
    status_playing: Node = null;
    @property(Node)
    status_pause: Node = null;
    @property(Node)
    status_over: Node = null;
    @property(Node)
    player: Node = null;
    @property(Node)
    scoreNode: Node = null;
    @property(Node)
    overScore: Node = null;
    @property(Node)
    historyScore: Node = null;
    @property(Node)
    btn_sound: Node = null;
    @property(Node)
    btn_mute: Node = null;
    @property(Node)
    bomb: Node = null;
    @property(Node)
    bomb_num: Node = null;

    // 播放声音的组件
    bgm: AudioSource;

    // 创建公共静态对象
    public static instance: main = null;
    // 得分
    score: number = 0;
    // 炸弹数量
    bombNum: number = 0;

    // 历史最高分数
    maxScore: number;

    setstate(value: states) {
        state = value;
        // 遍历观察者数组，给所有观察者发消息
        for (let observer of observers) {
            observer.state(value);
        }
    }

    start() {
        // 静态对象赋值为当前对象
        main.instance = this;
        this.setstate(states.over);
        // 获取 AudioSource 组件
        this.bgm = this.node.getComponent(AudioSource);
    }

    update(deltaTime: number) {
        // 判断游戏进行中才对背景进行移动
        if (state == states.playing) {
            this.bjMove(deltaTime);
            this.status_playing.setSiblingIndex(666);
        }
        this.scoreNode.getComponent(Label).string = '得分：' + this.score.toString();
        this.scoreNode.setSiblingIndex(666);
    }

    bjMove(dt: number) {
        // 遍历子节点（背景）
        for (let child of this.bj.children) {
            // 移动
            child.setPosition(0, child.position.y - 100 * dt, 0);
            if (child.position.y < -1300) {
                child.setPosition(0, child.position.y + 1136 * 3, 0);
            }
        }
    }

    // 开始游戏
    clickStart() {
        this.setstate(states.playing);
        this.status_ready.active = false;
        this.status_playing.active = true;
        this.bomb.active = false
        if (mute) this.bgm.play();
    }

    // 静音
    clickMute() {
        mute = !mute;
        if (mute) {
            this.bgm.play();
            this.btn_sound.active = true;
            this.btn_mute.active = false;
        } else {
            this.bgm.pause();
            this.btn_mute.active = true;
            this.btn_sound.active = false;
        }
    }

    // 暂停
    pause() {
        this.setstate(states.pause);
        this.status_playing.active = false;
        this.status_pause.active = true;
        this.status_pause.setSiblingIndex(666);
        this.bgm.pause();
    }

    // 继续
    continue() {
        this.setstate(states.playing);
        this.status_pause.active = false;
        this.status_playing.active = true;
        if (mute) this.bgm.play();
    }

    // 游戏结束
    over() {
        this.setstate(states.over);
        this.status_playing.active = false;
        this.status_over.active = true;
        this.status_over.setSiblingIndex(666);
        // 本局得分
        this.overScore.getComponent(Label).string = '得分：' + this.score.toString();
        // 取出历史分数与本局分数比较
        this.maxScore = JSON.parse(sys.localStorage.getItem('maxScore'));
        if(this.maxScore && this.score < this.maxScore){
            this.historyScore.getComponent(Label).string = '历史最高：' + this.maxScore;
        }else {
            this.historyScore.getComponent(Label).string = '历史最高：' + this.score;
            sys.localStorage.setItem('maxScore', this.score.toString());
        }
        this.bgm.stop();
    }

    // 重新开始
    restart() {
        this.home();
        this.scheduleOnce(() => {
            this.clickStart();
        }, 0)
    }

    // 回到主页
    home() {
        this.setstate(states.over);
        this.score = 0;
        this.bombNum = 0;
        this.bgm.stop();
        this.scheduleOnce(() => {
            this.setstate(states.ready);
            this.status_over.active = false;
            this.status_pause.active = false;
            this.status_ready.active = true;
        }, 0)
    }

    // 吃到炸弹道具
    eatBomb(){
        if(this.bombNum > 2) return;
        this.bombNum++;
        this.bomb.active = true;
        this.bomb_num.getComponent(Label).string = 'x ' + this.bombNum.toString();
    }

    // 使用炸弹
    useBomb(){
        if(!--this.bombNum) this.bomb.active = false;
        this.bomb_num.getComponent(Label).string = 'x ' + this.bombNum.toString();
        this.setstate(states.cls)
        this.scheduleOnce(()=>{
            this.setstate(states.playing)
        }, 0);
    }
}

