var app = angular.module('publibag', ['angular.filter','socialLogin', 'ngCookies', 'ngRoute', 'ngSanitize', 'ui.bootstrap', 'pascalprecht.translate']);


//---BASE_URL----//
//var BASE_URL = 'http://localhost/publibag_back/public/';
var BASE_URL = 'https://publibag.com/publibag_back/';

var imgupload = 'images/upload.jpg';
var tokenDepublibag = '';
var tokenDeOasisValCompte = '';

app.factory('userLogged', function ($http, $q, $cookies, $location) {
    console.log('Dans l\'initialisation des fonctions');
    var urlEnCours = $location.absUrl().split('?')[0];
    var urlEnCours2 = $location.absUrl();

    // REINITIALISATION MOT DE PASSE
    var res = window.location.pathname;
    console.log('aaa='+urlEnCours+'//ffff'+urlEnCours2);

    var searchTerm = 'tokenpublibag';
    var reponse = urlEnCours2.indexOf(searchTerm);
    var indexToken, getToken;
    if(reponse !== -1)
    {
        indexToken = urlEnCours2.indexOf('tokenpublibag');
        getToken = urlEnCours2.substring(indexToken+(searchTerm.length+1), urlEnCours2.length);
        console.log('token forgot pwd=', getToken);
        tokenDepublibag = getToken;
    }

    // ACTIVATION COMPTE
    searchTerm = 'tokenactivationpublibag';
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

    /*
    var pageEnCours = urlEnCours.substring(urlEnCours.indexOf('/'), urlEnCours.length);
    var base_url_projet = 'oasis_front';
    console.log(res);
    //----------Redirection des pages-------//
    if (res === '/' + base_url_projet + '/connexion.html') {
        console.log('Mettre les données de la CONNEXION');
        var pp = 'yes';
    }
    if (res === '/' + base_url_projet + '/index.html') {
        console.log('Mettre les données de l ACCUEIL');
    }
    */
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
                    url: BASE_URL + '/graphql?query={' + element + '{metadata{total,per_page,current_page,last_page},data{' + listeattributs + '}}}'
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
                console.log('Dans login');
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
                    url: BASE_URL + (is_graphQL ? '/graphql?query= {'+element+' {'+listeattributs+'} }' : element),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data:dataget
                }).then(function successCallback(response)
                {
                    /*lorsque la requete contient des paramètres, il faut decouper pour recupérer le tableau*/
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
                    url: BASE_URL + '/graphql?query={'+element+'{metadata{total,per_page,current_page,last_page},data{'+listeattributs+'}}}'
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
                console.log('Dans inscription');
                /*var deferred = $q.defer();
                $http({
                    method: 'POST',
                    url: BASE_URL + (!is_an_update ? 'inscription' : 'update-user'),
                    data: data,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function successCallback(response) {
                    factory.data = response['data'];
                    deferred.resolve(factory.data);
                }, function errorCallback(response) {
                    deferred.reject("Impossible de récupérer les éléments depuis le serveur distant");
                });
                return deferred.promise;
                */



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
                            deferred.reject(msg_erreur);

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


app.filter('changeDate', [ '$translate',
    function ($translate) { // should be altered to suit your needs
        return function (input) {
            input = input + "";

            var find = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            var replace = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

            return $translate.use().match('en') ? input : input.replaceArray(find, replace);

        };
    }]);


app.filter('changeDatePart', [ '$translate',
    function ($translate) { // should be altered to suit your needs
        return function (input) {
            input = input + "";

            var find = ['Mond', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            var replace = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

            return $translate.use().match('en') ? input : input.replaceArray(find, replace);

        };
    }]);


// Configuration du routage au niveau de l'app

//-------DEBUT = POUR LA TRADUCTION----------------------//
app.config(function ($translateProvider) {
    $translateProvider.translations('fr', {
        ACCUEIL: 'Accueil',
        TEACHER: 'L\'équipe',
        GALLERY: 'Galerie photos',
        PRATIQUE: 'Pratiques',
        PRATIQUE1: 'Pratiques',
        TARIF: 'Tarifs',
        PLANNING: 'Planning',
        PLANNING_INFO: '* A la demande des professeurs, pour tout cours collectif, un minimum de 2 personnes est exigé, sans quoi le cours sera malheureusement annulé.',
        CONTACT: 'Contacts',
        CONNEXION: 'CONNEXION',
        EQUIPE: 'L\'Equipe',
        BOUTIQUE: 'La Boutique',
        EQUIPEMIN: 'L\'équipe',
        WELCOMEHOME: 'Bienvenue Chez',
        RESTEFORME: 'Restez informés, inscrivez-vous à notre newsletter',
        TEXTRESTEFORME: 'Abonnez-vous gratuitement à notre newsletter',
        HOME1: 'Yogi Vida accueille des talents de tous horizons et de toutes formations, attentifs, généreux, authentiques et centrés. Yogi Vida est un lieu où chacun peut se ressourcer à son rythme vers une connexion du corps, de l’esprit et du cœur, pour mieux se tourner vers l’essence même de nôtre être et de la vie.',
        HOME2: 'Un univers feutré, des bougies, des couleurs chaudes, un mélange de matières, de la musique pour oublier le quotidien et s’offrir une parenthèse de bien-être suspendue hors du temps. Yogi Vida est une invitation au lâcher prise, au respect et à l’amour de soi, pour une connexion ultime du corps et de l’esprit.',
        HOME3: 'Apprendre à s’aimer, à s’écouter, à se respecter est notre vocation à partager avec vous. Entendre les signaux de son corps, de son cœur et de son âme, savoir comprendre chaque émotion en conscience, et déceler les zones d’inconforts sont une partie intégrante du chemin qui nous mène vers un mieux-être.',
        HOME_PRATIQUE: 'Le club vous offre des pratiques dynamiques dans un atmosphère propice à la détente et au bien-être',
        HOME_TARIF: 'YOGI VIDA accueille ses membres ou visiteurs du lundi au vendredi, de 10h30 à 21h et samedi, de 8h30 à 12h30',
        HOME_PLANNING: 'Une vingtaine de cours hebdomadaires pour répondre aux attentes de chacun',
        HOME_ALLPLAN: 'Tout le planning',
        HOME_BTN_VOIR: 'Voir details',
        HOME_BTN_LOG: 'Se connecter',
        HOME_ESPRIT: 'L\'ESPRIT DE YOGI VIDA',
        HOME_ESPRIT1: 'Bien-être',
        HOME_ESPRIT2: 'Une bulle Zen',
        HOME_RESTO: 'Goutez à notre cuisine variée, saine et naturellement gourmande',
        HOME_PLANNINGCOURS: 'Planning des cours',
        BUTTON_LANG_FR: 'FR',
        BUTTON_LANG_EN: 'EN',
        RIGHTS: 'tous droits réservés',
        EQUIPE_SESPRATIQUES: 'Ses pratiques',
        APROPOS: 'Notre Histoire',
        APROPOS3: 'Notre historique',
        APROPOS1: 'Fondatrice de Yogi Vida',
        APROPOS2: "Après 15 années passées à Paris, d’abord à étudier puis à travailler dans la recherche clinique, Sarah Charara rentre à Dakar en 2011 pour s’installer en tant que chef de projet free-lance dans l’industrie pharmaceutique. Avec des prédispositions et un attrait évident depuis très jeune, pour la psychologie, le développement personnel, et toutes les méthodes visant le mieux-vivre d’un individu, elle se retrouve face à de nombreux questionnements une fois retournée dans son pays natal. A partir de 2011, elle mène une vie professionnelle très riche et pleine de succès, elle parcourt l’Afrique, rencontre énormément de monde et finit Directrice des Opérations Cliniques de la société qui l’a faite venir au Sénégal. En 2017, une épreuve marquera un tournant décisif dans la direction qu’elle voudra donner à sa vie, tant professionnelle que privée. Elle fera des retraites, des voyages, des séminaires, avalera des dizaines de livres, s’intéressera aux énergies, au chamanisme, à la méditation mais surtout elle va pratiquer de manière plus assidue, et presque salvatrice, qu’elle ne le faisait depuis 2008, le yoga dans tous ses aspects. En mars 2018, elle quitte la recherche clinique pour se consacrer à des activités moins lucratives mais plus épanouissantes. En juillet 2018, une retraite au Costa Rica avec Deepak Chopra provoquera le déclic et l’intention de retranscrire quelque chose en rapport avec le yoga et le développement personnel en Afrique sera posée. En septembre 2018, après un trek éprouvant au Mustang, elle découvre à Paris un studio de Yoga qui est la réplique améliorée d’un concept new-yorkais dont elle est fan : le déclic est décuplé. L’intention devient cette fois viscérale. L’attention fixée. L’Univers a fait le reste : la dynamique YOGI VIDA était lancée.",
        BOUTIQUE_TEXT1: 'Nous aimons le yoga, et nous aimons partager sa pratique tout en soutenant des marques originales. Nous choisissons nos produits en vente selon ' +
            'des critères de qualité, de style, et surtout d’éthique.',
        BOUTIQUE_NOSMARQUES: 'Nos marques',
        BOUTIQUE_CATEGORIE: 'CATEGORIE DES PRODUITS',
        BOUTIQUE_RECHERCHE: 'Recherche ...',
        HOME_PL_COURS: 'Planning des cours',
        HOME_PL_ALLPLAN: 'Tout le planning',
        PRATIQUE_MIN: 'Les pratiques',
        TARIF_TINF: 'Tarifs & Infos',
        TARIF_Y1: 'Yoga en Entreprise',
        TARIF_Y2: 'Veuillez contacter',
        TARIF_Y3: 'info@oasisyogaclub.com pour plus d\'informations.',
        TARIF_YO: 'L’étiquette de Studio',
        TATIF_YOG: 'Afin de respecter le temps et les horaires personnels de chacun, nous débutons nos cours à l’heure \n\
      et nous n’acceptons pas les retardataires. \n\
      Arrivez 15 minutes à l’avance pour vous enregistrer à l’accueil. \n\
      Prière de vous enregistrer à votre cours à l\'avance, et nous prévenir 2 heures à l’avance pour toute annulation ou changement de programme. \n\
      Des tapis de yoga sont disponibles gratuitement. \n\
      Les serviettes sont disponibles en location. \n\
      Gardez le silence une fois dans les salles de pratique; les téléphones sont interdits. \n\
      Informez votre professeur pour tout souci de santé. \n\
      Ecoutez votre corps et n’essayez pas d’aller au delà de vos limites. \n\
      Faites des pauses autant que nécessaire, personne ne vous jugera. \n\
      Venez avec un esprit ouvert. Laissez votre ego à la porte et le reste se fera tout seul.',
        TARIF_ABONNER: 'S\'abonner',
        PLANNING_MIN: 'Planning',
        PLANNING_DESCRIPTION: 'Nos locaux sont prêts à vous accueillir. Nos playlists sont énergisantes et nos professeurs inspirants et sympathiques. \n\
    Nous enseignons ce que nous aimons à Oasis, et nous sommes présents pour vous accompagner dans votre propre aventure',
        PLANNING_ALLCOURS: 'Toutes les pratiques',
        PLANNING_ALLZONES: 'Toutes les zones',
        PLANNING_RESERVER: 'Réservation',
        PLANNING_ATTENTE: 'File d\'attente',
        PLANNING_HORAIRE: 'Debut',
        PLANNING_HORAIRE_FIN: 'Fin',
        PLANNING_A: 'Au',
        PLANNING_D: 'Du',
        PLANNING_FILTRER: 'FILTRER',
        CONTACT_TXT: 'Pour toutes informations complémentaires, \n\
    n\'hésitez pas à utiliser le formulaire ci-dessous pour nous laisser un message. Nous vous répondrons dans les plus brefs délais.',
        CONTACT_CONTACTER: 'NOUS CONTACTER',
        CONTACT_PHOLDER1: 'Entrez votre nom',
        CONTACT_PHOLDER2: 'Nom de votre entreprise',
        CONTACT_PHOLDER3: 'Entrez votre email',
        CONTACT_PHOLDER4: 'Entrez votre numéro de téléphone',
        CONTACT_PHOLDER5: 'Mettez votre message ici',
        CONTACT_BTN: 'Envoyer',
        CONNEXION_T1: 'Se connecter à YOGI VIDA',
        CONNEXION_T2: 'Adresse Email',
        CONNEXION_T3: 'Nouveau mot de passe',
        CONNEXION_T31: 'Répéter mot de passe',
        CONNEXION_T32: 'Valider',
        CONNEXION_T4: 'Connexion',
        CONNEXION_T5: 'Pas encore de compte',
        CONNEXION_T6: 'Creer un compte',
        CONNEXION_T7: 'Mot de passe oublié ?',
        CONNEXION_T8: 'Mot de Se rappeler de moi',
        CONNEXION_PHOLDER1: 'Entrez votre adresse email',
        CONNEXION_PHOLDER2: 'Entrez votre mot de passe',
        INSCRIPTION_T1: 'Rejoindre yogi vida',
        INSCRIPTION_T2: 'Prénom et Nom',
        INSCRIPTION_T3: 'Adresse Email',
        INSCRIPTION_T4: 'Numéro mobile',
        INSCRIPTION_T5: 'Mot de passe',
        INSCRIPTION_T6: 'Confirmer votre mot de passe',
        INSCRIPTION_T7: 'Genre',
        INSCRIPTION_T8: 'Inscription',
        INSCRIPTION_T9: 'Homme',
        INSCRIPTION_T10: 'Femme',
        INSCRIPTION_PHOLDER1: 'Prénom',
        INSCRIPTION_PHOLDER2: 'Nom',
        INSCRIPTION_PHOLDER3: 'Adresse email',
        INSCRIPTION_PHOLDER4: 'Numéro de téléphone',
        INSCRIPTION_PHOLDER5: 'Entrez un mot de passe',
        INSCRIPTION_PHOLDER6: 'Confirmer le mot de passe',
        FORGOTPWD_TXT: 'Rénitialiser votre mot de passe',
        FORGOTPWD_PHOLDER: 'Entrez votre adresse email',
        FORGOTPWD_BTN: 'Valider',
        FORGOTPWD2_PHOLDER1: 'Entrez votre nouveau mot de passe',
        FORGOTPWD2_PHOLDER2: 'Confirmez votre nouveau mot de passe',
        RESTO_PANIER: 'PANIER',
        PROFIL_P0: 'Attendez SVP...',
        PROFIL_P1: 'Bienvenue sur votre espace client YOGI VIDA',
        PROFIL_P2: 'Déconnexion',
        PROFIL_P3: 'Que souhaitez-vous faire?',
        PROFIL_P4: 'Vous pouvez changer vos informations de connexion, accédez à vos réservations, à vos abonnements et mettre à jour votre compte.',
        PROFIL_P5: 'Mes <br/>abonnements',
        PROFIL_P6: 'Mes <br/>réservations',
        PROFIL_P7: 'Modifier <br/>votre compte',
        PROFIL_P8: 'Accéder <br/>au pratique',
        PROFIL_P9: 'Accéder <br/>au planning',
        PROFIL_P10: 'La <br/>Boutique',
        PROFIL_ABONNE1: 'Vos abonnements',
        PROFIL_ABONNE2: 'Vous n\'avez pas encore effectué d\'abonnements!',
        PROFIL_RSV1: 'Vos réservations',
        PROFIL_RSV2: 'Vous n\'avez pas encore de réservation en cours!',
        PROFIL_CMD1: 'Vos commandes',
        PROFIL_CMD2: 'Vous n\'avez pas encore passé de commandes!',
        PROFIL_USER1: 'Modifier votre compte',
        PROFIL_USER2: 'Informations personnelles',
        PROFIL_USER3: 'Nom',
        PROFIL_USER4: 'Prénom',
        PROFIL_USER5: 'Changement de mot de passe',
        PROFIL_USER6: 'Veuillez remplir les champs suivants seulement si vous souhaitez changer votre mot de passe actuel. A défaut, vous pouvez les laisser vides!',
        PROFIL_USER7: 'Votre nouveau mot de passe',
        PROFIL_USER8: 'Confirmer votre nouveau mot de passe',
        PROFIL_USER9: 'Sauvegarder',
        PROFIL_USER10: 'ou',
        PROFIL_USER11: 'Annuler',
        PROFIL_USER12: 'Modifier votre avatar',
        PROFIL_USER13: 'choisir une photo',
        PROFIL_USER14: 'Réactiver',
        PROFIL_USER15: 'Relancer',
        PROFIL_RSV_1: 'Date cours',
        PROFIL_RSV_2: 'Pratique',
        PROFIL_RSV_3: 'Zone Pratique',
        PROFIL_RSV_4: 'Horaires',
        PROFIL_RSV_5: 'Etat',
        PROFIL_RSV_6: 'Salle de reservation',
        PROFIL_AB_1: 'DEBUT SEANCE',
        PROFIL_AB_2: 'NOM PACK',
        PROFIL_AB_3: 'TYPE PACK',
        PROFIL_AB_4: 'NOMBRE DE SEANCE',
        PROFIL_AB_5: 'DATE FIN SEANCE',
        PROFIL_AB_6: 'MONTANT PAYER',
        PROFIL_AB_7: 'SEANCE RESTANCE',
        NEWSLETTER_PHOLDER: 'Entrez votre adresse mail ici...',
        NEWSLETTER_BTN: 'S\'inscrire',
        ALLRIGHTS: 'tous droits réservés'
    });
    $translateProvider.translations('en', {
        ACCUEIL: 'Home',
        TEACHER: 'Team',
        GALLERY: ' Photos Gallery',
        PRATIQUE: 'Practices',
        PRATIQUE1: 'Practices',
        TARIF: 'The Prices',
        PLANNING: 'The Schedule',
        PLANNING_INFO: '* At the request of professors, for any collective class, a minimum of 2 people is required, otherwise the course will be canceled',
        CONTACT: 'Contact us',
        CONNEXION: 'Connexion',
        EQUIPE: 'The Team',
        BOUTIQUE: 'The Shop',
        EQUIPEMIN: 'The team',
        WELCOMEHOME: 'Welcome to',
        RESTEFORME: 'Stay informed, subscribe to our newsletter',
        TEXTRESTEFORME: 'Subscribe for free to our newsletter',
        HOME1: 'Yogi Vida welcomes talents from all backgrounds and all formations, attentive, generous, authentic and centered. Yogi Vida is a place where everyone can relax at their own pace towards a connection of body, mind and heart, to better turn to the essence of our being and life.',
        HOME2: 'A subdued universe, candles, warm colors, a mix of materials, music to forget the everyday and offer a parenthesis of well-being suspended timeless. Yogi Vida is an invitation to let go, respect and self-love, for an ultimate connection of body and mind.',
        HOME3: 'Learning to love oneself, to listen to oneself, to respect oneself is our vocation to share with you. Hearing the signals of one\'s body, one\'s heart and one\'s soul, knowing how to understand each emotion in consciousness, and identifying areas of discomfort are an integral part of the path to wellness.',
        HOME_PRATIQUE: 'The club offers dynamic practices in an atmosphere conducive to relaxation and well-being',
        HOME_TARIF: 'YOGI VIDA welcomes its members or visitors from Monday to Friday, from 10:30 to 21h and Saturday from 8:30 to 12:30',
        HOME_PLANNING: 'Twenty weekly classes to meet everyone\'s expectations',
        HOME_ALLPLAN: 'All the planning',
        HOME_BTN_VOIR: 'See details',
        HOME_BTN_LOG: 'Log in',
        HOME_ESPRIT: 'THE SPIRIT OF YOGI VIDA',
        HOME_ESPRIT1: 'Welfare',
        HOME_ESPRIT2: 'A Zen bubble',
        HOME_RESTO: 'Taste our varied cuisine, healthy and naturally greedy',
        HOME_PLANNINGCOURS: 'Course schedule',
        BUTTON_LANG_FR: 'FR',
        BUTTON_LANG_EN: 'EN',
        RIGHTS: 'all rights reserved',
        EQUIPE_SESPRATIQUES: 'His courses',
        APROPOS: 'Our history',
        APROPOS3: 'Our history',
        APROPOS1: 'Founder of Yogi Vida',
        APROPOS2: "After 15 years in Paris, first studying and then working in clinical research, Sarah Charara returned to Dakar in 2011 to settle as a freelance project leader in the pharmaceutical industry. With predispositions and an obvious attraction since very young, for the psychology, the personal development, and all the methods aiming at the well-being of an individual, she is faced with many questions once returned to her native country. From 2011, she leads a very rich and successful professional life, she travels Africa, meets a lot of people and ends up Director of Clinical Operations of the company that made her come to Senegal. In 2017, an event will mark a turning point in the direction she will want to give to her life, both professional and private. She will make retreats, travels, seminars, will swallow dozens of books, will be interested in energies, shamanism, meditation but above all she will practice more assiduously, and almost saving, than she has done since 2008, yoga in all its aspects. In March 2018, she left clinical research to devote herself to less lucrative but more fulfilling activities. In July 2018, a retreat in Costa Rica with Deepak Chopra will trigger and the intention to transcribe something related to yoga and personal development in Africa will be asked. In September 2018, after a demanding trek in Mustang, \n" +
            "she discovers in Paris a Yoga studio which is the improved replica of a New York concept of which she is a fan: the click is increased tenfold. The intention becomes visceral this time. The attention fixed. The Universe did the rest: the dynamic YOGI VIDA was launched.",
        BOUTIQUE_TEXT1: 'We love yoga, and we love to share his practice while supporting original brands. We choose our products for sale according to criteria of quality,' +
            ' style, and especially ethics.',
        BOUTIQUE_NOSMARQUES: 'Our brands',
        BOUTIQUE_CATEGORIE: 'CATEGORY OF PRODUCTS',
        BOUTIQUE_RECHERCHE: 'Search ...',
        HOME_PL_COURS: 'Course schedule',
        HOME_PL_ALLPLAN: 'All schedule',
        PRATIQUE_MIN: 'The Pratices',
        PRATIQUE_DESC: 'Anyone who wants to do and discover the world of yoga can do it and benefit from it more than interesting. No matter what your age, level of physical activity or degree of flexibility, we have the courses you need! Looking for a meditation experience or a high intensity yoga class? Our premises are ready to welcome you; our playlists are energizing and our teachers friendly. We teach what we love about Oasis, and we are ready to accompany you in your own adventure.',
        TARIF_TINF: 'Rates & Info',
        TARIF_Y1: 'Yoga in Business',
        TARIF_Y2: 'Please contact',
        TARIF_Y3: 'info@publibag.com for more informations.',
        TARIF_YO: 'The Studio label',
        TATIF_YOG: 'In order to respect the time and the personal schedules of each one, we start our lessons on time \n\
and we do not accept latecomers. \n\
Arrive 15 minutes in advance to register at the reception. \n\
Please register at your class in advance, and notify us 2 hours in advance for any cancellation or program change. \n\
Yoga mats are available for free. \n\
Towels are available for rent. \n\
Keep quiet once in the practice rooms; phones are forbidden. \n\
Inform your teacher about any health concerns. \n\
Listen to your body and do not try to go beyond your limits. \n\
Take breaks as much as necessary, no one will judge you. \n\
Come with an open mind. Leave your ego at the door and the rest will be done alone.',
        TARIF_ABONNER: 'Subscribe',
        PLANNING_DESCRIPTION: 'Our premises are ready to welcome you. Our playlists are energizing and our teachers inspiring and friendly. \n\
We teach what we love at Oasis, and we are here to accompany you on your own adventure',
        PLANNING_ALLCOURS: 'All practices',
        PLANNING_ALLZONES: 'All zones',
        PLANNING_RESERVER: 'Booking',
        PLANNING_ATTENTE: 'Waiting',
        PLANNING_HORAIRE: 'Early',
        PLANNING_HORAIRE_FIN: 'End',
        PLANNING_A: 'Of',
        PLANNING_D: 'The',
        PLANNING_FILTRER: 'FILTER',
        CONTACT_TXT: 'For any further information, \n\
please use the form below to leave us a message. We will respond as soon as possible.',
        CONTACT_CONTACTER: 'CONTACT US',
        CONTACT_PHOLDER1: 'Enter your name',
        CONTACT_PHOLDER2: 'Name of your company',
        CONTACT_PHOLDER3: 'Enter your email',
        CONTACT_PHOLDER4: 'Enter your phone number',
        CONTACT_PHOLDER5: 'Write your message here',
        CONTACT_BTN: 'Send',
        CONNEXION_T1: 'Connect to YOGI VIDA',
        CONNEXION_T2: 'E-mail adress',
        CONNEXION_T3: 'New password',
        CONNEXION_T31: 'Repeat password',
        CONNEXION_T32: 'Validate',
        CONNEXION_T4: 'Login',
        CONNEXION_T5: 'No account yet',
        CONNEXION_T6: 'Register',
        CONNEXION_T7: 'Forgot your password ?',
        CONNEXION_T8: 'Remember me',
        CONNEXION_PHOLDER1: 'Enter your email adress',
        CONNEXION_PHOLDER2: 'Entrer your password',
        INSCRIPTION_T1: 'Join YOGI VIDA',
        INSCRIPTION_T2: 'First and last name',
        INSCRIPTION_T3: 'E-mail adress',
        INSCRIPTION_T4: 'Mobile number',
        INSCRIPTION_T5: 'Password',
        INSCRIPTION_T6: 'Confirm your password',
        INSCRIPTION_T7: 'Gender',
        INSCRIPTION_T8: 'Registration',
        INSCRIPTION_T9: 'Man',
        INSCRIPTION_T10: 'Woman',
        INSCRIPTION_PHOLDER1: 'First name',
        INSCRIPTION_PHOLDER2: 'Last name',
        INSCRIPTION_PHOLDER3: 'Email adress',
        INSCRIPTION_PHOLDER4: 'Phone number',
        INSCRIPTION_PHOLDER5: 'Enter a password',
        INSCRIPTION_PHOLDER6: 'Confirm the password',
        FORGOTPWD_TXT: 'Reset your password',
        FORGOTPWD_PHOLDER: 'Entrer your email adress',
        FORGOTPWD_BTN: 'Submit',
        FORGOTPWD2_PHOLDER1: 'Entrer your new password',
        FORGOTPWD2_PHOLDER2: 'Confirm your new password',
        RESTO_PANIER: 'CART',
        PROFIL_P0: 'Please wait...',
        PROFIL_P1: 'Welcome to your profile YOGI VIDA',
        PROFIL_P2: 'Log out',
        PROFIL_P3: 'What do you want to do?',
        PROFIL_P4: 'You can change your login information, access your bookings, subscriptions, and update your account.',
        PROFIL_P5: 'My <br/>subscriptions',
        PROFIL_P6: 'My <br/>bookings',
        PROFIL_P7: 'Edit <br/>your account',
        PROFIL_P8: 'Go to <br/>the practice',
        PROFIL_P9: 'Go to <br/>the planning',
        PROFIL_P10: 'Go to <br/>the shop',
        PROFIL_ABONNE1: 'Your subscriptions',
        PROFIL_ABONNE2: 'You have not done any subscriptions yet',
        PROFIL_RSV1: 'Your bookings',
        PROFIL_RSV2: 'You have not any booking in progress',
        PROFIL_CMD1: 'Your orders',
        PROFIL_CMD2: 'You have not done any orders yet!',
        PROFIL_USER1: 'Edit your account',
        PROFIL_USER2: 'Your personal informations',
        PROFIL_USER3: 'Last name',
        PROFIL_USER4: 'First name',
        PROFIL_USER5: 'Change your password',
        PROFIL_USER6: 'Please complete the following fields only if you want to change your current password. Otherwise, you can leave them empty!',
        PROFIL_USER7: 'Your new password',
        PROFIL_USER8: 'Confirm your new password',
        PROFIL_USER9: 'Save',
        PROFIL_USER10: 'or',
        PROFIL_USER11: 'Cancel',
        PROFIL_USER12: 'Edit your avatar',
        PROFIL_USER13: 'choose a photo',
        PROFIL_USER14: 'Reactivate',
        PROFIL_USER15: 'Resume',
        PROFIL_RSV_1: 'Date course',
        PROFIL_RSV_2: 'Practice',
        PROFIL_RSV_3:'PRACTICAL AREA',
        PROFIL_RSV_4:'Schedule',
        PROFIL_RSV_5:'State',
        PROFIL_RSV_6:'BOOK ROOM',
        PROFIL_AB_1:'Start session',
        PROFIL_AB_2:'NAME PACK',
        PROFIL_AB_3:'Pack type',
        PROFIL_AB_4:'NUMBER OF RESERVATION',
        PROFIL_AB_5:'DATE FIN SESSION',
        PROFIL_AB_6:'AMOUNT PAY',
        PROFIL_AB_7:'SEANCE RESTANCE',
        NEWSLETTER_PHOLDER: 'Enter your email address here ...',
        NEWSLETTER_BTN: 'Register',
        ALLRIGHTS: 'all rights reserved',
    });
    $translateProvider.preferredLanguage('fr');
});

//-------FIN = POUR LA TRADUCTION----------------------//

app.config(function (socialProvider) {
    socialProvider.setGoogleKey("572267196269-ghd2qbp1etdnu9diobkv5pnra4ghd62q.apps.googleusercontent.com");
    socialProvider.setLinkedInKey("791991711135843");
    socialProvider.setFbKey({ appId: "YOUR FACEBOOK APP ID", apiVersion: "API VERSION" });
});

app.controller('afterLoginCtl', function (Init, userLogged, $location, $scope, $cookies, $filter, socialLoginService, $log, $q, $route, $routeParams, $translate, $http, $window) {
    $scope.showPopover = false;

    var listofrequests_assoc =
        {
            "typeoffres"                           : "id,designation,validite_requise,description,offres{id,designation,prix,type_offre{id,designation,validite_requise},nb_seance,nb_jour_validite,text_validity,souscriptions{id},offre_type_pratiques{id,type_pratique{id,designation},nb_seance}}",
            "typepratiques"                        : "id,designation,pratiques{id,designation,image,description,description_en,type_pratique_id,type_pratique{id,designation},professeur_pratiques{id},salle_pratiques{id}},offre_type_pratiques{id}",
            "pratiques"                            : "id,designation,image,description,description_en,type_pratique_id,type_pratique{id,designation},professeur_pratiques{id},salle_pratiques{id}",
            "professeurs"                          : "id,description,description_en,telephone,user_id,user{id,name,email,image},professeur_pratiques{id,pratique{designation}},nb_contrat,nb_programme,created_at_fr",
            "typetarifs"                           : "id,designation,description,tarifs{id, designation, prix, frequence_seance{id,designation},nb_seance},frequence_duree{id,designation,nb_jour},duree",
            "marques"                              : "id,designation,image,showatwebsite,produits{id},nb_sous_produit",
            "imggaleries"                          : "id,description,image,showatwebsite",
            "programmes"                           : "id,date,file_attente,date_fr,date_fr_day,heure_debut,heure_fin,etat,salle_pratique{id,salle_id,pratique_id,pratique{id,designation},salle{id,designation}},professeur_pratique{id,professeur_id,pratique{designation},professeur{id,user{name}},pratique_id},contrat{id},programme_langues{id,langue_id,langue{id,designation}},programme_niveaus{id,niveau_id,niveau{id,designation}},type_personne{id},reservations{id},displayetat,displaycoloretat,user{name,image}",
            "zones"                                : "id,designation,adresse,salles{id}",
            "reservations"                         : "id,etat,displayetat,displaycoloretat,en_attente,created_at_fr,programme{id,salle_pratique{salle{designation,zone{designation}}},date_fr,heure_debut,heure_fin,professeur_pratique{id,professeur_id,pratique{designation},professeur{id,user{name}},pratique_id}},souscription{id,client{id,nom_complet}}",
            "souscriptions"                        : "id,nb_seance_restant,date,date_fr,date_expiration,offre_id,offre{id,designation,nb_seance,type_offre{id,designation}},client_id,client{id,nom_complet,telephone,email},reservations{id},total_amount,displayetat,displaycoloretat,user{name,image},etat,prix_offre",
            "planningsemaines"                     : "id,user_id,start_date,start_date_fr,end_date,end_date_fr,fichier,created_at_fr,user{name,image}",
            "niveaus"                              : "id,designation"
        };


    $scope.trierElement=function (type,element,propriete="") {

        console.log('trierElement');
        if (type.indexOf('pratique')!==-1)
        {
            if (propriete.match('selected'))
            {
                $scope.pratiqueSelected = element;
                // Si la langue est en anglais, on change le contenu de la variable "description" par défaut
                if ($translate.use().match('en'))
                {
                    $scope.pratiqueSelected.description = element.description_en;
                }
            }
        }
        else if (type.indexOf('professeur')!==-1)
        {
            if (propriete.match('selected'))
            {
                $scope.professeurSelected = element;
                // Si la langue est en anglais, on change le contenu de la variable "description" par défaut
                if ($translate.use().match('en'))
                {
                    $scope.professeurSelected.description = element.description_en;
                }
            }
        }
        else if (type.indexOf('produit')!==-1)
        {
            if (propriete.match('selected'))
            {
                $scope.produitSelected = element;
                // Si la langue est en anglais, on change le contenu de la variable "description" par défaut
                if ($translate.use().match('en'))
                {
                    // $scope.produitSelected.description = element.description_en;
                }
            }
        }
        else if (type.indexOf('offre')!==-1)
        {
            if (propriete.match('selected'))
            {
                $scope.offreSelected = element;
            }
        }
    };

    $scope.getelements = function (type, addData=null)
    {
        rewriteType = type;
        if (type.indexOf("marque")!==-1 || type.indexOf("pratiques")!==-1 || type.indexOf("typeoffres")!==-1 || type.indexOf("professeurs")!==-1)
        {
            rewriteType = rewriteType + "(showatwebsite:true)";
            console.log('rewriteType', rewriteType);
        }
        if (type.indexOf("planningsemaines")!==-1)
        {
            rewriteType = rewriteType + "(current_day:true)";
            console.log('rewriteType', rewriteType);
        }
        Init.getElement(rewriteType, listofrequests_assoc[type]).then(function(data)
        {
            console.log('données yi = ', type, data);

            if (type.indexOf("pratiques")!==-1)
            {
                $scope.pratiques = data;
            }
            if (type.indexOf("typepratiques")!==-1)
            {
                $scope.typepratiques = data;
            }
            if (type.indexOf("typeoffres")!==-1)
            {
                $scope.typeoffres = data;
            }
            else if (type.indexOf("professeurs")!==-1)
            {
                $scope.professeurs = data;
            }
            else if (type.indexOf("marques")!==-1)
            {
                $scope.marques = data;
            }
            else if (type.indexOf("zones")!==-1)
            {
                $scope.zones = data;
            }
            else if (type.indexOf("planningsemaines")!==-1)
            {
                $scope.planningsemaines = data;
                $scope.current_planningweek = data[0];
            }
            else if (type.indexOf("niveaus")!==-1)
            {
                $scope.niveaus = data;
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
        console.log('pageChanged', currentpage, "liste des pratiques:" , $('#pratique_listprogramme').val());

        if ( currentpage.indexOf('programme')!==-1 )
        {
            rewriteelement = 'programmespaginated(page:'+ $scope.paginationprogramme.currentPage +',count:'+ $scope.paginationprogramme.entryLimit
                /* = listprogramme*/ + ($('#zone_listprogramme').val() ? ',zone_id:' + $('#zone_listprogramme').val() : "" )
                /* = listprogramme*/ + ($('#pratique_listprogramme').val() ? ',pratique_ids:' + '"' +$('#pratique_listprogramme').val() + '"' : "" )
                /* = listprogramme*/ + ($('#niveau_listprogramme').val() ? ',niveau_ids:' + '"' +$('#niveau_listprogramme').val() + '"' : "" )
                /* = listprogramme*/ + ($('#heure_debut_listprogramme').val() ? ',heure_debut:' + '"' + $('#heure_debut_listprogramme').val() + '"' : "" )
                /* = listprogramme*/ + ($('#heure_fin_listprogramme').val() ? ',heure_fin:' + '"' + $('#heure_fin_listprogramme').val() + '"' : "" )
                /* = listprogramme*/ + ($('#date_start_listprogramme').val() ? ',date_start:' + '"' + $('#date_start_listprogramme').val() + '"' : "" )
                /* = listprogramme*/ + ($('#date_end_listprogramme').val() ? ',date_end:' + '"' + $('#date_end_listprogramme').val() + '"' : "" )
                +',is_front:true)';
            if ($.fn.blockUI_start)
            {
                $('body').blockUI_start();
            }
            Init.getElementPaginated(rewriteelement, listofrequests_assoc["programmes"]).then(function (data)
            {
                if ($.fn.blockUI_start)
                {
                    $('body').blockUI_stop();
                }

                $scope.paginationprogramme = {
                    currentPage: data.metadata.current_page,
                    maxSize: 10,
                    entryLimit: $scope.paginationprogramme.entryLimit,
                    totalItems: data.metadata.total
                };
                $scope.programmes = data.data;
            },function (msg)
            {
                $('body').blockUI_stop();
                console.log('programme', msg);
            });
        }
        else if ( currentpage.indexOf('imggalerie')!==-1 )
        {
            rewriteelement = 'imggaleriespaginated(page:'+ $scope.paginationimggalerie.currentPage +',count:'+ $scope.paginationimggalerie.entryLimit
                +')';
            if ($.fn.blockUI_start)
            {
                $('body').blockUI_start();
            }
            Init.getElementPaginated(rewriteelement, listofrequests_assoc["imggaleries"]).then(function (data)
            {
                if ($.fn.blockUI_start)
                {
                    $('body').blockUI_stop();
                }

                $scope.paginationimggalerie = {
                    currentPage: data.metadata.current_page,
                    maxSize: 10,
                    entryLimit: $scope.paginationimggalerie.entryLimit,
                    totalItems: data.metadata.total
                };
                $scope.imggaleries = data.data;
            },function (msg)
            {
                $('body').blockUI_stop();
                console.log('reservation', msg);
            });
        }
        else if ( currentpage.indexOf('reservation')!==-1 )
        {
            rewriteelement = 'reservationspaginated(page:'+ $scope.paginationreservation.currentPage +',count:'+ $scope.paginationreservation.entryLimit
                + ($scope.userConnected ? ',client_id:' + $scope.userConnected.id : "" )
                +')';
            if ($.fn.blockUI_start)
            {
                $('body').blockUI_start();
            }
            Init.getElementPaginated(rewriteelement, listofrequests_assoc["reservations"]).then(function (data)
            {
                console.log('tu as pris les données,cool', data);
                if ($.fn.blockUI_start)
                {
                    $('body').blockUI_stop();
                }

                $scope.paginationreservation = {
                    currentPage: data.metadata.current_page,
                    maxSize: 10,
                    entryLimit: $scope.paginationreservation.entryLimit,
                    totalItems: data.metadata.total
                };
                $scope.reservations = data.data;
            },function (msg)
            {
                $('body').blockUI_stop();
                console.log('reservation', msg);
            });
        }
        else if ( currentpage.indexOf('souscription')!==-1 )
        {
            rewriteelement = 'souscriptionspaginated(page:'+ $scope.paginationsouscription.currentPage +',count:'+ $scope.paginationsouscription.entryLimit
                + ($scope.userConnected ? ',client_id:' + $scope.userConnected.id : "" )
                +')';

            if ($.fn.blockUI_start)
            {
                $('body').blockUI_start();
            }
            Init.getElementPaginated(rewriteelement, listofrequests_assoc["souscriptions"]).then(function (data)
            {
                if ($.fn.blockUI_start)
                {
                    $('body').blockUI_stop();
                }

                $scope.paginationsouscription = {
                    currentPage: data.metadata.current_page,
                    maxSize: 10,
                    entryLimit: $scope.paginationsouscription.entryLimit,
                    totalItems: data.metadata.total
                };
                $scope.souscriptions = data.data;
            },function (msg)
            {
                $('body').blockUI_stop();
                console.log('souscription', msg);
            });
        }
    };


    // Mettre la langue dans un cookie pour que le site traduise quelque soit la page
    var caretSelectionLanguage = ' <span uk-icon="triangle-down"></span>';
    if($cookies.getObject('langage'))
    {
        $translate.use($cookies.getObject('langage'));
        var selectionLangage = $cookies.getObject('langage').toUpperCase() + caretSelectionLanguage;
        angular.element(document.querySelectorAll('.langChoose')).html(selectionLangage);
    }
    else
    {
        $translate.use('fr');
        var selectionLangage = 'FR'+ caretSelectionLanguage;
        angular.element(document.querySelectorAll('.langChoose')).html(selectionLangage);
    }

    $scope.changeLanguage = function (key, contant)
    {
        console.log('Dans changement langage');
        // Mettre langage dasn cookies pour qu'il garde ca pour toutes les pages
        $cookies.putObject('langage', key);
        // Garder le langage sélectionné (FR ou EN) en changeant de page
        var selectionLangage = key.toUpperCase() + caretSelectionLanguage;
        angular.element(document.querySelectorAll('.langChoose')).html(selectionLangage);
        $translate.use(key);

    };


    $scope.donneesReservation = {'idClient':'', 'message':'', 'evenement':'', 'planning_id':''};

    $scope.reserverPlanning = function (e, idPlanning, sans_abonnement=false) {
        e.preventDefault();
        if ($scope.userConnected) {
            //let data = [];
            var data = {
                'client': $scope.userConnected.id,
                'programme': idPlanning,
            };
            if(sans_abonnement){
                data.sans_abonnement = true;
            }

            $('body').blockUI_start();
            $http({
                url: BASE_URL + 'reservation',
                method: 'POST',
                data: data,
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function (data) {
                $('body').blockUI_stop();
                if (data.data.errors) {
                    iziToast.error({
                        title: '',
                        message: data.data.errors,
                        position: 'topRight'
                    });
                }else{
                    $('body').blockUI_stop();
                    iziToast.success({
                        title: '',
                        message: 'Votre réservation a bien été prise en compte',
                        position: 'topRight'
                    });
                }
            })
        } else {
            iziToast.info({
                title: '',
                message: 'Veuillez vous connecter pour réserver',
                position: 'topRight'
            });
        }
        return 'yes';
    }

    $scope.planning_zone_id = null;
    $scope.planning_pratique_id = null;
    $scope.planningFilter = function (idFilter, ByFilter)
    {
        //----Affichage des planning par zone-----//
        angular.element(document.querySelectorAll('.planBy'+ByFilter)).removeClass('selected');
        angular.element(document.querySelector('#'+ByFilter+idFilter)).addClass('selected');
        if (ByFilter.indexOf('Zone')!==-1)
        {
            $scope.planning_zone_id = null;
        }
        else if (ByFilter.indexOf('Pratik')!==-1)
        {
            $scope.planning_pratique_id = null;
        }

        if(idFilter != 0)
        {
            if (ByFilter.indexOf('Zone')!==-1)
            {
                $scope.planning_zone_id = idFilter;
            }
            else if (ByFilter.indexOf('Pratik')!==-1)
            {
                $scope.planning_pratique_id = idFilter;
            }
        }
        $scope.pageChanged('planning');
    };


    $scope.abonnerPack = function (e, idPack) {
        e.preventDefault();
        if ($scope.userConnected) {
            //let data = [];
            var data = {
                'client': $scope.userConnected.id,
                'tarif': idPack,
            }
            $('body').blockUI_start();
            $http({
                url: BASE_URL + 'abonnement',
                method: 'POST',
                data: data,
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function (data) {
                $('body').blockUI_stop();
                console.log("dd = "+JSON.stringify(data.data));
                if (data.data.errors) {
                    iziToast.error({
                        title: '',
                        message: data.data.errors,
                        position: 'topRight'
                    });
                }else{
                    iziToast.success({
                        title: '',
                        message: "Votre abonnement a été effectué avec succès",
                        position: 'topRight'
                    });
                }
            })
        } else {
            iziToast.info({
                title: '',
                message: 'Veuillez vous connecter pour s\'abonner à un pack',
                position: 'topRight'
            });
        }
        return 'yes';
    }

    $scope.annulerReservaton = function (e, idReservation, idEtat) {
        e.preventDefault();
        if ($scope.userConnected)
        {
            var data = {
                'etat': idEtat,
                'id': idReservation,
            }
            var messUser = "Réservation annulée";
            if(idEtat == 0){
                var messUser = "Réservation réactualisée";
            }
            $('body').blockUI_start();
            $http({
                url: BASE_URL + 'reservation/statut',
                method: 'POST',
                data: data,
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function (data) {
                $('body').blockUI_stop();
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
                        message: messUser,
                        position: 'topRight'
                    });
                    var urlRedirection = "./reservations.html";
                    setTimeout(function () {
                        window.location.href = urlRedirection;
                    }, 1000);
                }
            })
        }
        else
        {
            iziToast.info({
                title: '',
                message: 'Veuillez vous connecter',
                position: 'topRight'
            });
        }
        return 'yes';
    };

    $scope.relancerReservation = function (e, idReservation, idAttente) {
        e.preventDefault();
        if ($scope.userConnected)
        {
            var data = {
                'en_attente': idAttente,
                'id': idReservation,
            }
            var messUsers = "Réservation en attente";
            if(idAttente == 0){
                var messUsers = "Réservation relancée";
            }
            $('body').blockUI_start();
            $http({
                url: BASE_URL + 'reservation/attente',
                method: 'POST',
                data: data,
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function (data) {
                $('body').blockUI_stop();
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
                        message: messUsers,
                        position: 'topRight'
                    });
                    var urlRedirection = "./reservations.html";
                    setTimeout(function () {
                        window.location.href = urlRedirection;
                    }, 1000);
                }
            })
        }
        else
        {
            iziToast.info({
                title: '',
                message: 'Veuillez vous connecter',
                position: 'topRight'
            });
        }
        return 'yes';
    };

    $scope.contactezNous = function (e)
    {
        e.preventDefault();
        var prefixeForm = 'contacteznous';
        var form = $('#' + prefixeForm);
        senddata = form.serializeObject();
        console.log('senddata form', senddata);

        if (form.validate(prefixeForm))
        {
            form.blockUI_start();
            $http({
                url: BASE_URL + 'contact',
                method: 'POST',
                data: senddata,
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function (data) {
                form.blockUI_stop();
                console.log('retour formulaire = '+JSON.stringify(data.data));
                if (data.data.errors) {
                    iziToast.error({
                        title: '',
                        message: data.data.errors,
                        position: 'topRight'
                    });
                }else{
                    iziToast.success({
                        title: '',
                        message: data.data.success,
                        position: 'topRight'
                    });
                    console.log("datadata ", data)
                    $scope.emptyForm(prefixeForm);
                }
            });
        }
    };


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
            if(tokenDepublibag == '')
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
                    token: tokenDepublibag
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


    $scope.newsLetter = function (e)
    {
        e.preventDefault();
        var prefixeForm = "newsletter";
        var form = $('#' + prefixeForm);
        senddata = form.serializeObject();
        console.log("senddata form=", JSON.stringify(senddata));
        if (form.validate(prefixeForm))
        {
            form.blockUI_start();
            $http({
                url: BASE_URL + 'newsletter',
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
                }
            });
        }
    };



    // $locale.NUMBER_FORMATS.GROUP_SEP = ' ';
    $scope.userConnected = userLogged.isLogged();
    $scope.userLogged = { login: "", password: "" };
    $scope.resetPassword = "";



    whereAreWe = window.location.href;
    console.log('whereAreWe', whereAreWe);
    if (whereAreWe.indexOf('pratiques')!==-1)
    {
        $scope.getelements("typepratiques");
        $scope.getelements("pratiques");
    }
    else if (whereAreWe.indexOf('teachers')!==-1)
    {
        $scope.getelements("professeurs");
    }
    else if (whereAreWe.indexOf('tarifs')!==-1)
    {
        $scope.getelements("typeoffres");
    }
    else if (whereAreWe.indexOf('profil')!==-1)
    {
        if ($scope.userConnected==null)
        {
            iziToast.warning({
                title: 'Vous n\'êtes pas connecté',
                position: 'topRight'
            });

            var urlRedirection = "../connexion.html";
            setTimeout(function () {
                window.location.href = urlRedirection;
            }, 500);
        }
        else
        {
            var type = "saveaccount";
            if (whereAreWe.indexOf('update-profil')!==-1)
            {
                console.log('userInfos', $scope.userConnected);
                $('#id_' + type).val($scope.userConnected.id);
                $('#nom_complet_' + type).val($scope.userConnected.nom_complet);
                $('#telephone_' + type).val($scope.userConnected.telephone);
                $('#email_' + type).val($scope.userConnected.email);
                $('#genre_' + type + '_' + $scope.userConnected.type_personne_id).prop('checked', true);
                $("input[id*=password]").each(function () {
                    $(this).val("");
                });
            }
            else if (whereAreWe.indexOf('reservations')!==-1)
            {
                $scope.paginationreservation = {
                    currentPage: 1,
                    maxSize: 8,
                    entryLimit: 7,
                    totalItems: 0
                };
                $scope.pageChanged("reservation");
            }
            else if (whereAreWe.indexOf('abonnements')!==-1)
            {
                $scope.paginationsouscription = {
                    currentPage: 1,
                    maxSize: 8,
                    entryLimit: 7,
                    totalItems: 0
                };
                $scope.pageChanged("souscription");
            }
        }
    }
    else if (whereAreWe.indexOf('galeries')!==-1)
    {
        $scope.paginationimggalerie = {
            currentPage: 1,
            maxSize: 10,
            entryLimit: 6,
            totalItems: 0
        };
        $scope.pageChanged("imggalerie");
    }
    else if (whereAreWe.indexOf('boutique')!==-1)
    {
        $scope.getelements("marques");
    }
    else if (whereAreWe.indexOf('planning')!==-1)
    {
        $scope.paginationprogramme = {
            currentPage: 1,
            maxSize: 10,
            entryLimit: 7,
            totalItems: 0
        };
        $scope.getelements("pratiques");
        $scope.getelements("zones");
        $scope.getelements("niveaus");
        $scope.getelements("planningsemaines");
        $scope.pageChanged("programme");
    }
    else
    {
        $scope.paginationprogramme = {
            currentPage: 1,
            maxSize: 10,
            entryLimit: 5,
            totalItems: 0
        };
        $scope.pageChanged("programme");
    }


    console.log('window.location', window.location.href);
    //-------DEBUT = FONCTIONS GRAPHQL POUR L4AFFICHAGE----------------------//






    //----Affichage des types tarifs et des tarifs-----//



    //--Pour les données de l'utilisateur--//
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

        $('#form_login').blockUI_start();
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
                $scope.userConnected.estConnectei = 'true';
                //$scope.nomUser = 'Thierno Ndiaye';
                $window.sessionStorage.setItem('connectei', true);
                $scope.estConnectei = $window.sessionStorage.getItem('connectei');


                iziToast.success({
                    title: 'Connexion',
                    message: 'Vous êtes connecté',
                    position: 'topRight'
                });
                var urlRedirection = "profil/index.html";
                setTimeout(function () {
                    window.location.href = urlRedirection;
                }, 500);
            }
        }, function (msg)
        {
            form.blockUI_stop();
            iziToast.error({
                title: 'Connexion',
                message: "Paramètres incorrectes",
                position: 'topRight'
            });
            console.log('erreur', msg);
        });
    };

    $scope.passwordReset = function (e)
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
                    title: 'Mot de passe oublié',
                    message: data.success,
                    position: 'topRight'
                });
                $scope.emptyForm('passwordreset');
                $('#seconnecter').trigger('click');
            }
            else
            {
                iziToast.error({
                    title: 'Mot de passe oublié',
                    message: data.errors,
                    position: 'topRight'
                });
            }
        }, function (msg)
        {
            $('#form_passwordreset').blockUI_stop();
            iziToast.error({
                title: 'Mot de passe oublié',
                message: "Erreur depuis le serveur, contactez le support technique",
                position: 'topRight'
            });
        });
    };

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
        console.log('Dans déconnexion');
        //$scope.userConnected = null;
        userLogged.LogOut();
        //$scope.userConnected.estConnectei = 'false';
        $scope.userConnected = userLogged.isLogged();
        //$scope.userConnected.id = 0;
        //$window.sessionStorage.setItem('connectei', false);
        $scope.estConnectei = $window.sessionStorage.getItem('connectei');
        //console.log('testinnnnnnnnnnnnnng = '+$scope.estConnectei);
        iziToast.info({
            title: 'Vous vous êtes déconnecté',
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

        console.log("formulaire", form.html());
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
                    var urlRedirection = "connexion.html";
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
                        // On modifie les informations du user actuellement connecté
                        userData = retour.data;
                    }

                    userLogged.loginUser(userData);
                    $scope.userConnected = userLogged.isLogged();

                    $("input[id*=password]").each(function () {
                        $(this).val("");
                    });

                    iziToast.success({
                        title: 'Information',
                        message: "Mise à jour effectuée avec succès",
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


// Vérification de l'extension des elements uploadés
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
            alert("L'extension du fichier choisi ne correspond pas aux règles sur les fichiers pouvant être uploader"),
                $('#img'+idform).val(""),
                $('#affimg'+idform).attr("src",""),
                $('.input-modal').val("")
        );
}
