var app = angular.module('samakeur', ['angular.filter','socialLogin', 'ngCookies', 'ui.bootstrap']);

//---BASE_URL----//
var BASE_URL = 'http://localhost/samakeurback/public/';
//var BASE_URL = 'http://samakeurci.com/admin/';

var imgupload = 'images/upload.jpg';
var tokenDesamakeur = '';
var tokenDeOasisValCompte = '';

app.factory('userLogged', function ($http, $q, $cookies, $location) {
    console.log('Dans l\'initialisation des fonctions');
    var urlEnCours = $location.absUrl().split('?')[0];
    var urlEnCours2 = $location.absUrl();

    // REINITIALISATION MOT DE PASSE
    var res = window.location.pathname;
    console.log('aaa='+urlEnCours+'//ffff'+urlEnCours2);

    var searchTerm = 'tokensamakeur';
    var reponse = urlEnCours2.indexOf(searchTerm);
    var indexToken, getToken;
    if(reponse !== -1)
    {
        indexToken = urlEnCours2.indexOf('tokensamakeur');
        getToken = urlEnCours2.substring(indexToken+(searchTerm.length+1), urlEnCours2.length);
        console.log('token forgot pwd=', getToken);
        tokenDesamakeur = getToken;
    }

    // ACTIVATION COMPTE
    searchTerm = 'tokenactivationsamakeur';
    reponse = urlEnCours2.indexOf(searchTerm);
    if(reponse !== -1)
    {
        indexToken = urlEnCours2.indexOf(searchTerm);
        getToken = urlEnCours2.substring(indexToken+(searchTerm.length+1), urlEnCours2.length);
        console.log('token validation cmp=', getToken);
        tokenDeOasisValCompte = getToken;
        if(tokenDeOasisValCompte === '')
        {
            iziToast.error({
                title: '',
                message: 'Token incorrect',
                position: 'topRight'
            });
        }
        else
        {
            var databi = { token: tokenDeOasisValCompte };
            $http({
                url: BASE_URL + 'activation_compte',
                method: 'POST',
                data: databi,
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function (data)
            {
                if (data.data.errors)
                {
                    iziToast.error({
                        title: '',
                        message: data.data.errors,
                        position: 'topRight'
                    });
                }
                else
                {
                    iziToast.success({
                        title: '',
                        message: data.data.message,
                        position: 'topRight'
                    });
                    var urlRedirection = "connexion.html";
                    setTimeout(function () {
                        window.location.href = urlRedirection;
                    }, 500);
                }
            })
        }
    }

    var factory =
        {
            pathCookie: {path:'/'},
            data: false,
            loginUser: function (userData) {
                $cookies.putObject('userData', userData,factory.pathCookie);
            },
            isLogged: function () {
                return $cookies.getObject('userData');
            },
            LogOut: function ($scope) {
                console.log('Dans LOGOUT');
                //$cookies.putObject('userData', null);
                $cookies.remove('userData',factory.pathCookie);
                //$scope.userConnected = null;
            },
            getElementPaginated: function (element, listeattributs) {
                var deferred = $q.defer();
                $http({
                    method: 'GET',
                    url: BASE_URL + 'graphql?query={' + element + '{metadata{total,per_page,current_page,last_page},data{' + listeattributs + '}}}'
                }).then(function successCallback(response) {
                    factory.data = response['data']['data'][!element.indexOf('(') != -1 ? element.split('(')[0] : element];
                    deferred.resolve(factory.data);
                }, function errorCallback(error) {
                    console.log('erreur serveur', error);
                    deferred.reject(error);
                });
                return deferred.promise;
            }
        };
    return factory;
});

app.factory('Init', function ($http, $q) {
    var factory =
        {
            data: false,
            loginUser: function (data) {
                console.log('Dans login', data);
                var deferred = $q.defer();
                $http({
                    url: BASE_URL + 'connexion',
                    method: 'POST',
                    data: data,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function successCallback(response) {

                    factory.data = response['data'];
                    deferred.resolve(factory.data);
                }, function errorCallback(response) {
                    console.log('erreur lors de la connexion', response);
                    deferred.reject("Erreur lors de la connexion");
                });
                return deferred.promise;
            },
            passwordReset: function (data) {
                var deferred = $q.defer();
                $http({
                    method: 'POST',
                    url: BASE_URL + 'password_reset/',
                    data: data,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function successCallback(response) {
                    factory.data = response['data'];
                    deferred.resolve(factory.data);
                }, function errorCallback(response) {
                    console.log('erreur lors de la connexion', response);
                    deferred.reject("Erreur lors de la connexion");
                });
                return deferred.promise;
            },
            activationAccount: function (data) {
                var deferred = $q.defer();
                $http({
                    method: 'POST',
                    url: BASE_URL + 'validation_compte/',
                    data: data,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function successCallback(response) {
                    factory.data = response['data'];
                    deferred.resolve(factory.data);
                }, function errorCallback(response) {
                    console.log('erreur lors de la connexion', response);
                    deferred.reject("Erreur lors de la connexion");
                });
                return deferred.promise;
            },
            getElement:function (element,listeattributs, is_graphQL=true, dataget=null)
            {
                var deferred=$q.defer();
                console.log(dataget);
                $http({
                    method: 'GET',
                    url: BASE_URL + (is_graphQL ? 'graphql?query= {'+element+' {'+listeattributs+'} }' : element),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data:dataget
                }).then(function successCallback(response)
                {
                    /*lorsque la requete contient des paramï¿½tres, il faut decouper pour recupï¿½rer le tableau*/
                    if (is_graphQL)
                    {
                        factory.data = response['data']['data'][!element.indexOf('(')!=-1 ? element.split('(')[0] : element];
                    }
                    else
                    {
                        factory.data = response['data'];
                    }
                    deferred.resolve(factory.data);
                }, function errorCallback(error) {
                    console.log('erreur serveur', error);
                    deferred.reject(error);
                });
                return deferred.promise;
            },
            getElementPaginated:function (element,listeattributs)
            {
                var deferred=$q.defer();
                $http({
                    method: 'GET',
                    url: BASE_URL + 'graphql?query={'+element+'{metadata{total,per_page,current_page,last_page},data{'+listeattributs+'}}}'
                }).then(function successCallback(response) {
                    factory.data=response['data']['data'][!element.indexOf('(')!=-1 ? element.split('(')[0] : element];
                    deferred.resolve(factory.data);
                }, function errorCallback(error) {
                    console.log('erreur serveur', error);
                    deferred.reject(error);
                });
                return deferred.promise;
            },
            saveAccount: function (data, is_an_update) {
                console.log('Dans inscription', data);

                var deferred=$q.defer();
                $.ajax
                (
                    {
                        url: BASE_URL + (!is_an_update ? 'inscription' : 'update-user'),
                        type:'POST',
                        contentType:false,
                        processData:false,
                        DataType:'text',
                        data:data,
                        beforeSend: function()
                        {
                            //$('#modal_add'+element).blockUI_start();
                        },success:function(response)
                        {
                            console.log('retour saveaccount', response);

                            factory.data=response['data'];
                            if (response['data']==null)
                            {
                                factory.data=response;
                            }
                            //$('#modal_add'+element).blockUI_stop();

                            deferred.resolve(factory.data);
                        },
                        error:function (error)
                        {
                            //$('#modal_add' + element).blockUI_stop();
                            console.log('erreur serveur', error);
                           // deferred.reject(msg_erreur);

                        }
                    }
                );
                return deferred.promise;

            }
        };
    return factory;
});

// Pour mettre les espaces sur les montants
app.filter('convertMontant', [
    function () { // should be altered to suit your needs
        return function (input) {
            input = input + "";
            return input.replace(/,/g, " ");
        };
    }]);

app.config(function (socialProvider) {
    socialProvider.setGoogleKey("572267196269-ghd2qbp1etdnu9diobkv5pnra4ghd62q.apps.googleusercontent.com");
    socialProvider.setLinkedInKey("791991711135843");
    socialProvider.setFbKey({ appId: "YOUR FACEBOOK APP ID", apiVersion: "API VERSION" });
});

app.controller('afterLoginCtl', function (Init, userLogged, $location, $scope, $cookies, $filter, socialLoginService, $log, $q, $http, $window) {
    $scope.showPopover = false;

    var listofrequests_assoc =
        {

            /*"jeuxs"                          : "id,user_id,ligne_regularisations{id,ligne_inventaire_id,ligne_inventaire{actual_quantity,current_quantity},ligne_approvisionn    ement_id},created_at_fr,user{name,image}",
            "contacts"                       : "id,email,nomcomplet,telephone,message",
            "messages"                       : "id,email,nom,prenom,telephone,code,status",*/

            "plans"                         :  ["id,superficie,longeur,largeur,nb_pieces,nb_salon,nb_chambre,nb_cuisine,nb_toillette,nb_etage", ",niveau_plans{id,piece,bureau,toillette,chambre,salon,cuisine}"],

            "planprojets"                   :  ["id,plan_id,projet_id,etat_active,message,etat,plan{id}",""],

            "niveauplans"                   :  ["id",""],

            "niveauprojets"                 :  ["id",""],

            "projets"                       :  ["id,etat,active,a_valider,created_at_fr,created_at,superficie,longeur,largeur,nb_pieces,nb_salon,nb_chambre,nb_cuisine,nb_toillette,nb_etage,user_id,user{name,email,nom,prenom,telephone,adresse_complet,code_postal}", ",niveau_projets{id,piece,bureau,toillette,chambre,salon,cuisine},remarques{id,demande_text,projet_id,type_remarque_id}"],

            "clients"                       :  ["id",""],

            "typeremarques"                 :  ["id",""],

            "remarques"                     :  ["id,demande_text,projet_id,type_remarque_id",""],

            'permissions'                   :  ['id,name,display_name,guard_name', ""],

            "roles"                         :  ["id,name,guard_name,permissions{id,name,display_name,guard_name}", ""],

            "users"                         :  ["id,nom,prenom,adresse_complet,pays,code_postal,is_client,telephone,name,email,active,password,image,roles{id,name,guard_name,permissions{id,name,display_name,guard_name}}", ",last_login,last_login_ip,created_at_fr", ""],

            "dashboards"                    :  ["clients,assurances,ventes,fournisseurs"],
        };

    $scope.plans = [];
    $scope.planprojets = [];
    $scope.niveauplans = [];
    $scope.niveauprojets = [];
    $scope.projets = [];
    $scope.typeremarques = [];
    $scope.remarques = [];
    $scope.users = [];



    $scope.paginationprojet = {
        currentPage: 1,
        maxSize: 10,
        entryLimit: 10,
        totalItems: 0
    };

    $(".search-home-2").hide();
    $scope.searchPopo = function()
    {

        $(".btn-btn").on('click', function()
        {
            $(".search-home-2").fadeIn(700);
            $(".search-home-2").show();

            console.log('focus detecré');
        })

    }
    $scope.searchPopo2 = function()
    {

        $(".btn-btn-minus").on('click', function()
        {
            $(".search-home-2").fadeOut(700);
            $(".search-home-2").hide();
            console.log('focus retiré');
        });

    }

    $scope.getelements = function (type, addData=null)
    {
        rewriteType = type;
        Init.getElement(rewriteType, listofrequests_assoc[type]).then(function(data)
        {
            console.log('donnees yi = ', type, data);

            if (type.indexOf("typeclients")!==-1)
            {
                $scope.typeclients = data;
            }
            else if (type.indexOf("plans")!==-1)
            {
                $scope.plans = data;
            }
            else if (type.indexOf("planprojets")!==-1)
            {
                $scope.planprojets = data;
            }
            else if (type.indexOf("niveauplans")!==-1)
            {
                $scope.niveauplans = data;
            }
            else if (type.indexOf("niveauprojets")!==-1)
            {
                $scope.niveauprojets = data;
            }
            else if (type.indexOf("projets")!==-1)
            {
                $scope.projets = data;
            }
            else if (type.indexOf("typeremarques")!==-1)
            {
                $scope.typeremarques = data;
            }
            else if (type.indexOf("remarques")!==-1)
            {
                $scope.remarques = data;
            }
            else if (type.indexOf("permissions")!==-1)
            {
                $scope.permissions = data;
            }
            else if (type.indexOf("roles")!==-1)
            {
                if (forModal)
                {
                    $scope.roles_modal = data;
                }
                else
                {
                    $scope.roles = data;
                }
            }
            else if (type.indexOf("users")!==-1)
            {
                $scope.users = data;
            }
            else if (type.indexOf("dashboards")!==-1)
            {
                console.log('infos du dashboards', data);

            }
        }, function (msg) {
            iziToast.error({
                title: "ERREUR",
                message: "Erreur depuis le serveur, veuillez contactez l'administrateur",
                position: 'topRight'
            });
            console.log('Erreur serveur ici = ' + msg);
        });
    };

    $scope.pageChanged = function(currentpage)
    {

        console.log("cureeeent page", currentpage)

        if ( currentpage.indexOf('projet')!==-1 )
        {
            rewriteelement = 'projetspaginated(page:'+ $scope.paginationprojet.currentPage +',count:'+ $scope.paginationprojet.entryLimit
               /* + ($scope.projetview ? ',projet_id:' + $scope.projetview.id : "" )
                + ($scope.planview ? ',plan_id:' + $scope.planview.id : "" )
                + ($scope.clientview ? ',user_id:' + $scope.clientview.id : "" )
                + ($scope.radioBtnComposition ? ',etat:' + $scope.radioBtnComposition : "")
                + ($('#searchtexte_projet').val() ? (',' + $('#searchoption_projet').val() + ':"' + $('#searchtexte_projet').val() + '"') : "" )
                + ($('#projet_user').val() ? ',user_id:' + $('#projet_user').val() : "" )
                + ($('#created_at_start_listprojet').val() ? ',created_at_start:' + '"' + $('#created_at_start_listprojet').val() + '"' : "" )
                + ($('#created_at_end_listprojet').val() ? ',created_at_end:' + '"' + $('#created_at_end_listprojet').val() + '"' : "" )*/
                +')';
            Init.getElementPaginated(rewriteelement, listofrequests_assoc["projets"][0]).then(function (data)
            {
                $scope.paginationprojet = {
                    currentPage: data.metadata.current_page,
                    maxSize: 10,
                    entryLimit: $scope.paginationprojet.entryLimit,
                    totalItems: data.metadata.total
                };

                $scope.projets = data.data;
            },function (msg)
            {

                toastr.error(msg);
            });
        }
    };

    // Permet d'afficher le formulaire
    $scope.showModalAdd = function (type, tag = "", fromUpdate = false, check = 0) {
        setTimeout(function () {
            // On fait d'abord un destroy
            if (!$('select').data('select2')) {
                $('.select').select2('destroy');
            }
            // entrepriseabonnement
            $('.select2').select2();

        }, 500);


        $("#modal_" + type).modal('show');


    };

    $scope.produitsInTable = [];

    $scope.actionSurProjet = function (action, selectedItem = null) {
        if (action == 'add')
        {
            //Ajouter un élément dans le tableau
            var niveau = $("#niveau_projet").val();
            var piece_projet = $("#piece_projet").val();
            var chambre_projet = $("#chambre_projet").val();
            var bureau_projet = $("#bureau_projet").val();
            var salon_projet = $("#salon_projet").val();
            var cuisine_projet = $("#cuisine_projet").val();
            var toillette_projet = $("#toillette_projet").val();


            if ($scope.estEntier(piece_projet) == false) {
                iziToast.error({
                    message: "Sélectionnez une piece",
                    position: 'topRight'
                });
                return false;
            }
            if ($scope.estEntier(chambre_projet) == false) {
                iziToast.error({
                    message: "Sélectionnez une chambre",
                    position: 'topRight'
                });
                return false;
            }
            if ($scope.estEntier(salon_projet) == false) {
                iziToast.error({
                    message: "Sélectionnez une salon",
                    position: 'topRight'
                });
                return false;
            }
            if ($scope.estEntier(cuisine_projet) == false) {
                iziToast.error({
                    message: "Sélectionnez une cuisine",
                    position: 'topRight'
                });
                return false;
            }
            if ($scope.estEntier(toillette_projet) == false) {
                iziToast.error({
                    message: "Sélectionnez une toillette",
                    position: 'topRight'
                });
                return false;
            }
            else if ($scope.testSiUnElementEstDansTableau($scope.produitsInTable, niveau) == true) {
                iziToast.error({
                    message: "Le niveau est déja dans le tableau",
                    position: 'topRight'
                });
                return false;
            }

            $scope.produitsInTable.unshift({
                "niveau": niveau,
                "piece": piece_projet,
                "chambre": chambre_projet,
                "bureau": bureau_projet,
                "salon": salon_projet,
                "cuisine": cuisine_projet,
                "toillette": toillette_projet,
            });

            console.log("this.produitsInTable",$scope.produitsInTable)

            $("#niveau_projet").val('');
            $("#piece_projet").val('');
            $("#chambre_projet").val('');
            $("#salon_projet").val('');
            $("#cuisine_projet").val('');
            $("#bureau_projet").val('');
            $("#toillette_projet").val('');

        }
        else if (action == 'delete') {
            //Supprimer un élément du tableau
            $.each($scope.produitsInTable, function (keyItem, oneItem) {
                if (oneItem.id == selectedItem.id) {
                    $scope.produitsInTable.splice(keyItem, 1);
                    return false;
                }
            });
        }
        else {
            //Vider le tableau
            $scope.produitsInTable = [];
        }
    };
    // fin projet


    $scope.estEntier = function (val, superieur = true, peutEtreEgaleAzero = false) {
        //tags: isInt, tester entier
        var retour = false;
        if (val == undefined || val == null) {
            retour = false;
        } else if (val === '') {
            retour = false;
        } else if (isNaN(val) == true) {
            retour = false;
        } else if (parseInt(val) != parseFloat(val)) {
            retour = false;
        } else {
            if (superieur == false) {
                //entier inférieur
                if (parseInt(val) < 0 && peutEtreEgaleAzero == true) {
                    //]-inf; 0]
                    retour = true;
                } else if (parseInt(val) < 0 && peutEtreEgaleAzero == false) {
                    //]-inf; 0[
                    retour = true;
                } else {
                    retour = false;
                }
            } else {
                //entier supérieur
                if (parseInt(val) > 0 && peutEtreEgaleAzero == true) {
                    //[0; +inf[
                    retour = true;
                } else if (parseInt(val) > 0 && peutEtreEgaleAzero == false) {
                    //]0; +inf[
                    retour = true;
                } else {
                    retour = false;
                }
            }
        }
        return retour;
    };
    //---FIN => Tester si la valeur est un entier ou pas---//

    $scope.testSiUnElementEstDansTableau = function (tableau, idElement)
    {
        var retour = false;
        try
        {
            idElement = parseInt(idElement);
            $.each(tableau, function (keyItem, oneItem) {
                if (oneItem.id == idElement) {
                    retour = true;
                }
                return !retour;
            });
        }
        catch(error)
        {
            console.log('testSiUnElementEstDansTableau error =', error);
        }

        return retour;
    };

    $scope.electricite = 0;
    $scope.acces_voirie = 0;
    $scope.assainissement = 0;
    $scope.geometre = 0;
    $scope.courant_faible = 0;
    $scope.eaux_pluviable = 0;
    $scope.bornes_visible = 0;
    $scope.necessite_bornage = 0;

    $scope.userConnected = {id: 1, nom_complet: "papa thiam", email: "papathiame11@gmail.com"}

    $scope.addProjet = function (e) {
        e.preventDefault();

        if($('#electricte_projet').prop('checked') == true){
            $scope.electricite = 1;
        }
        else
        {
            $scope.electricite = 0;
        }
        if($('#accesvoirie_projet').prop('checked') == true){
            $scope.acces_voirie = 1;
        }
        else
        {
            $scope.acces_voirie = 0;
        }
        if($('#ass_projet').prop('checked') == true){
            $scope.assainissement = 1;
        }
        else
        {
            $scope.assainissement = 0;
        }
        if($('#cadastre_projet').prop('checked') == true){
            $scope.geometre = 1;
        }
        else
        {
            $scope.geometre = 0;
        }
        if($('#courant_faible_projet').prop('checked') == true){
            $scope.courant_faible = 1;
        }
        else
        {
            $scope.courant_faible = 0;
        }
        if($('#eaux_pluviable_projet').prop('checked') == true){
            $scope.eaux_pluviable = 1;
        }
        else
        {
            $scope.eaux_pluviable = 0;
        }
        if($('#bornes_visible_projet').prop('checked') == true){
            $scope.bornes_visible = 1;
        }
        else
        {
            $scope.bornes_visible = 0;
        }
        if($('#necessite_bornage_projet').prop('checked') == true){
            $scope.necessite_bornage = 1;
        }
        else
        {
            $scope.necessite_bornage = 0;
        }


        //  if ($scope.userConnected) {
            //let data = [];
            var data = {
                'client': 2,
                //'client': $scope.userConnected.id,
                'localisation': $('#localisation_projet').val(),
                'fichier': $('#fichier_projet').val(),
                'longeur': $('#longeur_projet').val(),
                'largeur': $('#largeur_projet').val(),
                'piscine': $('#piscine_projet').val(),
                'description': $('#description_projet').val(),
                'electricite': $scope.electricite,
                'acces_voirie': $scope.acces_voirie,
                'assainissement': $scope.assainissement,
                'geometre': $scope.geometre,
                'courant_faible': $scope.courant_faible,
                'eaux_pluviable': $scope.eaux_pluviable,
                'bornes_visible': $scope.bornes_visible,
                'necessite_bornage': $scope.necessite_bornage,
                'tab_projet': JSON.stringify($scope.produitsInTable),
            };

            console.log("icic les datas => ", data)
           // $('body').blockUI_start();
            $http({
                url: BASE_URL + 'projet',
                method: 'POST',
                data: data,
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function (data) {
               // $('body').blockUI_stop();
                if (data.data.error) {
                    iziToast.error({
                        title: '',
                        message: data.data.error,
                        position: 'topRight'
                    });
                }else{
                   // $('body').blockUI_stop();
                    iziToast.success({
                        title: '',
                        message: 'Votre demande a bien été prise en compte',
                        position: 'topRight'
                    });
                }
            })
       /* } else {
            iziToast.info({
                title: '',
                message: 'Veuillez vous connecter pour réserver',
                position: 'topRight'
            });
        }
        return 'yes';*/
    }

    $scope.resetPwd = function (e)
    {
        e.preventDefault();
        var form = $('#form_forgotpassword');
        senddata = form.serializeObject();
        //if ($scope.panier.length > 0) {
        form.blockUI_start();
        $http({
            url: BASE_URL + 'password-create',
            method: 'POST',
            data: senddata,
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (data)
        {
            form.blockUI_stop();
            if (data.data.errors)
            {
                iziToast.error({
                    title: '',
                    message: data.data.errors,
                    position: 'topRight'
                });
            }
            else
            {
                iziToast.success({
                    title: '',
                    message: data.data.message,
                    position: 'topRight'
                });
                var urlRedirection = "./connexion.html";
                setTimeout(function () {
                    window.location.href = urlRedirection;
                }, 500);
            }
        })
    };


    $scope.resetPwdConfirm = function (e)
    {
        e.preventDefault();
        var form = $('#form_resetpassword');
        senddata = form.serializeObject();
        console.log("form serialize=", senddata);
        //if ($scope.panier.length > 0) {
        form.blockUI_start();
        if(senddata.password != senddata.repassword)
        {
            form.blockUI_stop();
            iziToast.error({
                title: '',
                message: 'Les deux mots de passe ne correspondent pas',
                position: 'topRight'
            });
        }
        else
        {
            if(tokenDesamakeur == '')
            {
                form.blockUI_stop();
                iziToast.error({
                    title: '',
                    message: 'Le token n\'est pas bon',
                    position: 'topRight'
                });
            }
            else
            {
                var data = {
                    password: senddata.password,
                    token: tokenDesamakeur
                };
                $http({
                    url: BASE_URL + 'password-reset',
                    method: 'POST',
                    data: data,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function (data)
                {
                    form.blockUI_stop();
                    if (data.data.errors)
                    {
                        iziToast.error({
                            title: '',
                            message: 'Une erreur est survenue',
                            position: 'topRight'
                        });
                    }
                    else
                    {
                        iziToast.success({
                            title: '',
                            message: data.data.message,
                            position: 'topRight'
                        });
                        var urlRedirection = "./connexion.html";
                        setTimeout(function () {
                            window.location.href = urlRedirection;
                        }, 500);
                    }
                })
            }
        }
    };

    // $locale.NUMBER_FORMATS.GROUP_SEP = ' ';
    $scope.userConnected = userLogged.isLogged();
    $scope.userLogged = { login: "", password: "" };
    $scope.resetPassword = "";

    whereAreWe = window.location.href;
    console.log('whereAreWe', whereAreWe);
    if (whereAreWe.indexOf('mon-profil')!==-1)
    {
        console.log("je suis icici")
        $scope.pageChanged("projet");
      //  $scope.getelements("planprojets");
    }


    console.log('window.location', window.location.href);


    //--Pour les donnï¿½es de l'utilisateur--//
    var globalUserId = 0;
    if($scope.userConnected)
    {
        globalUserId = $scope.userConnected.id
    }

    $scope.signout = function () {
        socialLoginService.logout();
    };

    $scope.$on('event:social-sign-in-success', (event, userDetails) => {
        $scope.result = userDetails;
        //console.log('userDetails', userDetails);
        $scope.$apply();
    });
    $scope.$on('event:social-sign-out-success', function (event, userDetails) {
        $scope.result = userDetails;
        //console.log('deconnexion', userDetails);
    });

    //----Au rechargement de a la page, recuperer le panier de l'utilisateur

    // Connexion utilisateur
    $scope.loginUser = function (e) {
        console.log('Dans la fonction LOGIN');
        e.preventDefault();

        var form = $('#form_login');
        var data = form.serializeObject();
        console.log('data form', data);

        form.blockUI_start();
        Init.loginUser(data).then(function (data) {
            form.blockUI_stop();
            if (data.errors) {
                console.log('erreur data', data);

                iziToast.error({
                    title: 'Connexion',
                    message: data.errors,
                    position: 'topRight'
                });
            }
            else
            {
                // console.log('userconnected connexion', data);
                // Save user connected
                userLogged.loginUser(data.data);
                $scope.userConnected = userLogged.isLogged();
               // $scope.userConnected.estConnectei = 'true';
                $window.sessionStorage.setItem('connectei', true);
              //  $scope.estConnectei = $window.sessionStorage.getItem('connectei');


                iziToast.success({
                    title: 'Connexion',
                    message: 'Vous étes connecté',
                    position: 'topRight'
                });
                var urlRedirection = "mon-profil.html";
                setTimeout(function () {
                    window.location.href = urlRedirection;
                }, 500);
            }
        }, function (msg)
        {
            form.blockUI_stop();
            iziToast.error({
                title: 'Connexion',
                message: "Paramétres incorrectes",
                position: 'topRight'
            });
            console.log('erreur', msg);
        });
    };

  /*  $scope.passwordReset = function (e)
    {
        e.preventDefault();
        var form = $('#form_passwordreset');
        var data = form.serializeObject();
        $('#form_passwordreset').blockUI_start();
        Init.passwordReset(data).then(function (data)
        {
            $('#form_passwordreset').blockUI_stop();
            if (data != null && !data.errors)
            {
                iziToast.success({
                    title: 'Mot de passe oubliï¿½',
                    message: data.success,
                    position: 'topRight'
                });
                $scope.emptyForm('passwordreset');
                $('#seconnecter').trigger('click');
            }
            else
            {
                iziToast.error({
                    title: 'Mot de passe oubliï¿½',
                    message: data.errors,
                    position: 'topRight'
                });
            }
        }, function (msg)
        {
            $('#form_passwordreset').blockUI_stop();
            iziToast.error({
                title: 'Mot de passe oubliï¿½',
                message: "Erreur depuis le serveur, contactez le support technique",
                position: 'topRight'
            });
        });
    };
*/

    $scope.activationAccount = function (e) {
        e.preventDefault();

        var form = $('#form_activationaccount');
        var data = form.serializeObject();

        $('#form_activationaccount').blockUI_start();
        Init.activationAccount(data).then(function (data) {
            $('#form_activationaccount').blockUI_stop();
            if (data != null && !data.errors)
            {
                iziToast.success({
                    title: 'Compte',
                    message: data.success,
                    position: 'topRight'
                });
                $('#sincrire').trigger('click');
                $scope.emptyForm("saveaccount");
                $scope.emptyForm("activationaccount");
            }
            else
            {
                iziToast.error({
                    title: 'Activation de votre compte',
                    message: data.errors,
                    position: 'topRight'
                });
            }
        }, function (msg) {
            $('#form_activationaccount').blockUI_stop();
            iziToast.error({
                title: 'Activation de votre compte',
                message: "Erreur depuis le serveur, contactez le support technique",
                position: 'topRight'
            });
        });
    };

    $scope.LogOut = function () {
        console.log('Dans deconnexion');
        //$scope.userConnected = null;
        userLogged.LogOut();
        //$scope.userConnected.estConnectei = 'false';
        $scope.userConnected = userLogged.isLogged();
        //$scope.userConnected.id = 0;
        //$window.sessionStorage.setItem('connectei', false);
      //  $scope.estConnectei = $window.sessionStorage.getItem('connectei');
        //console.log('testinnnnnnnnnnnnnng = '+$scope.estConnectei);
        iziToast.info({
            title: 'Vous vous ï¿½tes dï¿½connectï¿½',
            position: 'topRight'
        });
        //$scope.userConnected = null;
        var urlRedirection = "../";
        setTimeout(function () {
            window.location.href = urlRedirection;
        }, 500);
        //$location.path( "/" );
    };

    $scope.saveAccount = function (e, is_updated = false) {
        e.preventDefault();

        var form = $('#member-profile');

        //console.log("formulaire", form.html());
        //senddata = form.serializeObject();
        var formdata=(window.FormData) ? ( new FormData(form[0])): null;
        var senddata=(formdata!==null) ? formdata : form.serialize();

        send_dataObj = form.serializeObject();


        console.log("form serialize data =", senddata);
        // console.log(senddata);

        form.blockUI_start();
        Init.saveAccount(senddata, (send_dataObj.id ? true : false)).then(function (retour)
        {
            console.log('retour', retour);
            form.blockUI_stop();
            // console.log('create account',retour);
            if (retour != null && !retour.errors)
            {
                if (!send_dataObj.id)
                {
                    // Inscription
                    $scope.emptyForm('saveaccount');
                    iziToast.success({
                        title: ('Information'),
                        //message: retour.success,
                        message: 'Inscription réussie, un mail d\'activation vous a été envoyé dans votre boite mail',
                        position: 'topRight'
                    });
                    var urlRedirection = "login.html";
                    setTimeout(function () {
                        window.location.href = urlRedirection;
                    }, 500);
                }
                else
                {

                    var userData = null;
                    if (send_dataObj.id)
                    {
                        userData = retour.clients[0];
                        delete userData.ca_souscription;
                        delete userData.ca_vente;
                        delete userData.nb_souscription;
                        delete userData.nb_reservation;
                        delete userData.nb_vente;
                        delete userData.souscriptions;
                        delete userData.type_personne;
                    }
                    else
                    {
                        // On modifie les informations du user actuellement connectï¿½
                        userData = retour.data;
                    }

                    userLogged.loginUser(userData);
                    $scope.userConnected = userLogged.isLogged();

                    $("input[id*=password]").each(function () {
                        $(this).val("");
                    });

                    iziToast.success({
                        title: 'Information',
                        message: "Mise à jour effectuée avec succés",
                        position: 'topRight'
                    });
                }
            }
            else
            {
                iziToast.error({
                    title: "Erreur",
                    message: retour.errors,
                    position: 'topRight'
                });
            }
        }, function (msg) {
            form.blockUI_stop();
            iziToast.error({
                title: ('INSCRIPTION'),
                message: "Le service est en maintenance, veuillez contactez le support technique",
                position: 'topRight'
            });
            console.log('erreur', msg);
        });
    };

    var currentRoute = null;
    $scope.$on('$routeChangeStart', function (next, current) {

        currentRoute = current;

    });

    $scope.$on('$routeChangeSuccess', function (next, current) {
        currentRoute = current;
        $scope.linknav = $location.path();
        if (angular.lowercase(current.templateUrl).indexOf("connexion-inscription") !== -1 && window.location.href.indexOf('confirmation-compte') !== -1) {
            setTimeout(function () {
                $('#member-profile').addClass('d-none');
                $('#form_activationaccount').removeClass('d-none');
                $scope.emptyForm('activationaccount');
                $scope.emptyForm('saveaccount');
                $scope.emptyForm('login');
                $('#div_login_activationaccount').removeClass("d-none");
            }, 200);
        }
    });

    $scope.emptyForm = function (type) {
        $("input[id$=" + type + "], textarea[id$=" + type + "], select[id$=" + type + "]").each(function () {
            $(this).val("");
        });
    };

    $scope.verifLink = function (link) {
        if (currentRoute.templateUrl && angular.lowercase(currentRoute.templateUrl).indexOf("home") == -1) {
            $location.path('/');
        }
    };


});

// Vï¿½rification de l'extension des elements uploadï¿½s
function isValide(fichier)
{
    var Allowedextensionsimg=new Array("jpg","JPG","jpeg","JPEG","gif","GIF","png","PNG");
    var Allowedextensionsvideo=new Array("mp4");
    for (var i = 0; i < Allowedextensionsimg.length; i++)
        if( ( fichier.lastIndexOf(Allowedextensionsimg[i]) ) != -1)
        {
            return 1;
        }
    for (var j = 0; j < Allowedextensionsvideo.length; j++)
        if( ( fichier.lastIndexOf(Allowedextensionsvideo[j]) ) != -1)
        {
            return 2;
        }
    return 0;
}

function Chargerphoto(idform)
{
    var fichier = document.getElementById("img"+idform);
    (isValide(fichier.value)!=0) ?
        (
            fileReader=new FileReader(),
                (isValide(fichier.value)==1) ?
                    (
                        fileReader.onload = function (event) { $("#affimg"+idform).attr("src",event.target.result);},
                            fileReader.readAsDataURL(fichier.files[0]),
                            (idform=='produit') ? $("#imgproduit_recup").val("") : ""
                    ):null
        ):(
            alert("L'extension du fichier choisi ne correspond pas aux rï¿½gles sur les fichiers pouvant ï¿½tre uploader"),
                $('#img'+idform).val(""),
                $('#affimg'+idform).attr("src",""),
                $('.input-modal').val("")
        );
}
