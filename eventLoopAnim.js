// draw a donat-charts easily
// new Arc(x, y, radius, startAngle, endAngle, antiClockwise)

function Task(color, stepMultiplier, x, y){
  this.stepLength = this.defaultStep * stepMultiplier;
  this.completed = 0;
  this.interval = null;

  this.todo = false;
  this.done = false;

  this.doneAttr = {
    strokeWidth: this.strokeWidth,
    strokeColor: bonsai.color(color)
  };
  this.todoAttr = {
    strokeWidth: this.strokeWidth,
    strokeColor: bonsai.color(color).lighter(0.3)
  };
}

Task.prototype.defaultStep = 0.1;
Task.prototype.strokeWidth = 20;
Task.prototype.radius = 10;


Task.prototype.drawTodo = function drawTodo(){
  stage.removeChild(this.todo);
  this.todo = new Arc(400, 150, this.radius, 0, this.completed, 1).attr(this.todoAttr);
  stage.addChild(this.todo);
};

Task.prototype.drawDone = function drawDone(){
  stage.removeChild(this.done);
  this.done = new Arc(400, 150, this.radius, 0, this.completed, 0).attr(this.doneAttr);
  stage.addChild(this.done);
};

Task.prototype.step = function step() {
  this.completed += this.stepLength;
  this.drawTodo();
  this.drawDone();
  if (this.completed >= Math.PI*2) {
    this.finished();
  }
};

Task.prototype.run = function run() {
  this.interval = setInterval(this.step.bind(this), 30);
  console.log('running');
};

Task.prototype.finished = function finished() {
  clearInterval(this.interval);
  console.log('done');
};

var t = new Task('red', 0.5);
t.drawTodo();

t.run();
