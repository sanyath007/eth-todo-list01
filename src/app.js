App = {
  loading: false,
  contract: {},

  load: async () => {
    await App.loadWeb3()
    await App.loadAccount()
    await App.loadContract()
    await App.render()
  },

  // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
  loadWeb3: async () => {    
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider
      web3 = new Web3(web3.currentProvider)
    } else {
      window.alert("Please connect to Metamask.")
    }

    // Modern dapp browsers...
    if (ethereum) {
      web3 = new Web3(ethereum)
      
      try {
        // Request account access if needed
        await ethereum.enable()
        // Acccounts now exposed
        // web3.eth.sendTransaction({/* ... */})
      } catch (error) {
        // User denied account access...
        console.log(error);        
      }
    } else if (web3) { // Legacy dapp browsers...
      App.web3Provider = web3.currentProvider
      web3 = new Web3(web3.currentProvider)
      // Acccounts always exposed
      web3.eth.sendTransaction({/* ... */})
    } else { // Non-dapp browsers...
      console.log('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }  
  },

  loadAccount: async () => {
    App.account = await web3.eth.getAccounts()    
  },

  loadContract: async () => {
    // Create a Javascript version of the smart contract
    const todoList = await $.getJSON('TodoList.json')
    App.contract.TodoList = TruffleContract(todoList)
    App.contract.TodoList.setProvider(App.web3Provider)

    App.todoList = await App.contract.TodoList.deployed()
  },

  renderTasks: async () => {
    // Load the total task count from the blockchain
    const taskCount = await App.todoList.taskCount()
    console.log(taskCount);
    const $taskTemplate = $('.taskTemplate')

    // Render out each task with a new task template
    for(var i = 1; i <= taskCount; i++) {
      // Fetch the task data from the blockchain
      const task = await App.todoList.tasks(i)
      console.log(task);
      const taskId = task[0].toNumber()
      const taskContent = task[1]
      const taskCompleted = task[2]

      // Create the html for the task
      const $newTaskTemplate = $taskTemplate.clone()
      $newTaskTemplate.find('.content').html(taskContent)
      $newTaskTemplate.find('.input')
                      .prop('name', taskId)
                      .prop('checked', taskCompleted)
                      .on('click', App.toggleCompleted)

      // Put the task in the correct list
      if(taskCompleted) {
        $('#completedTaskList').append($newTaskTemplate)
      } else {
        $('#taskList').append($newTaskTemplate)
      }
      
      // Show the task
      $newTaskTemplate.show()
    }
  },

  render: async () => {
    // Prevent double render
    if(App.loading) {
      return
    }

    App.setLoading(true)

    $('#account').html(App.account[0])

    // Render tasks
    await App.renderTasks()

    App.setLoading(false)
  },

  toggleCompleted: () => {

  },

  setLoading: (boolean) => {
    App.loading = boolean
    const loader = $('#loader')
    const content = $('#content')

    if(boolean) {
      loader.show()
      content.hide()
    } else {
      loader.hide()
      content.show()
    }
  }
}

$(() => {
  $(window).load(() => {
    App.load()
  })
})